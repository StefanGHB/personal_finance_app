package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Exeption.CategoryNotFoundException;
import com.example.personal_finance_app.Exeption.DuplicateCategoryException;
import com.example.personal_finance_app.Repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository, UserService userService) {
        this.categoryRepository = categoryRepository;
        this.userService = userService;
    }

    /**
     * Създаване на нова категория
     */
    public Category createCategory(Long userId, String name, TransactionType type, String color) {
        logger.info("Creating category '{}' for user ID: {}", name, userId);

        User user = userService.findById(userId);
        validateCategoryInput(name, type);

        Category category = new Category();
        category.setUser(user);
        category.setName(name.trim());
        category.setType(type);
        category.setColor(validateAndSetColor(color));
        category.setIsDefault(false);
        category.setIsDeleted(false); // Explicit set for new categories

        try {
            Category savedCategory = categoryRepository.save(category);
            logger.info("Successfully created category with ID: {}", savedCategory.getId());
            return savedCategory;
        } catch (DataIntegrityViolationException e) {
            logger.warn("Failed to create category - name already exists: {}", name);
            throw new DuplicateCategoryException("Category with name '" + name + "' already exists for this type");
        }
    }

    /**
     * Създаване на предварително зададена категория (за нови потребители)
     */
    public Category createDefaultCategory(User user, String name, TransactionType type, String color) {
        logger.debug("Creating default category '{}' for user ID: {}", name, user.getId());

        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setType(type);
        category.setColor(color);
        category.setIsDefault(true);
        category.setIsDeleted(false); // Explicit set for default categories

        return categoryRepository.save(category);
    }

    /**
     * Обновяване на категория
     */
    public Category updateCategory(Long userId, Long categoryId, String name, String color) {
        logger.info("Updating category ID: {} for user ID: {}", categoryId, userId);

        Category category = findUserCategory(userId, categoryId);

        // Проверка дали категорията е архивирана
        if (category.isDeleted()) {
            throw new IllegalArgumentException("Cannot update archived category. Please restore it first.");
        }

        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Category name is required");
        }

        category.setName(name.trim());
        category.setColor(validateAndSetColor(color));

        try {
            Category updatedCategory = categoryRepository.save(category);
            logger.info("Successfully updated category ID: {}", categoryId);
            return updatedCategory;
        } catch (DataIntegrityViolationException e) {
            logger.warn("Failed to update category - name already exists: {}", name);
            throw new DuplicateCategoryException("Category with name '" + name + "' already exists for this type");
        }
    }

    /**
     * SOFT DELETE на категория - Enterprise Implementation
     */
    public void deleteCategory(Long userId, Long categoryId) {
        logger.info("Soft deleting category ID: {} for user ID: {}", categoryId, userId);

        Category category = findUserCategory(userId, categoryId);

        // Проверка дали вече е изтрита
        if (category.isDeleted()) {
            throw new IllegalArgumentException("Category is already archived");
        }

        // Проверка за default категории
        if (category.getIsDefault()) {
            throw new IllegalArgumentException("Cannot archive default categories");
        }

        // SOFT DELETE - маркиране като изтрита
        category.markAsDeleted();
        categoryRepository.save(category);

        logger.info("Successfully archived category ID: {} (soft delete)", categoryId);
        logger.info("Category '{}' archived - {} transactions will keep this category",
                category.getName(),
                category.getTransactions() != null ? category.getTransactions().size() : 0);
    }

    /**
     * RESTORE архивирана категория
     */
    public Category restoreCategory(Long userId, Long categoryId) {
        logger.info("Restoring archived category ID: {} for user ID: {}", categoryId, userId);

        Category category = findUserCategoryIncludingDeleted(userId, categoryId);

        if (!category.isDeleted()) {
            throw new IllegalArgumentException("Category is not archived");
        }

        category.restore();
        Category restoredCategory = categoryRepository.save(category);

        logger.info("Successfully restored category ID: {}", categoryId);
        return restoredCategory;
    }

    /**
     * PERMANENT DELETE (само за админи или специални случаи)
     */
    public void permanentDeleteCategory(Long userId, Long categoryId) {
        logger.warn("PERMANENT DELETE requested for category ID: {} by user ID: {}", categoryId, userId);

        Category category = findUserCategoryIncludingDeleted(userId, categoryId);

        // Допълнителни проверки за permanent delete
        if (!category.getTransactions().isEmpty()) {
            throw new IllegalArgumentException("Cannot permanently delete category with transactions. Found " +
                    category.getTransactions().size() + " transactions.");
        }

        if (!category.getBudgets().isEmpty()) {
            throw new IllegalArgumentException("Cannot permanently delete category with budgets. Found " +
                    category.getBudgets().size() + " budgets.");
        }

        categoryRepository.delete(category);
        logger.warn("PERMANENTLY DELETED category ID: {} - THIS ACTION CANNOT BE UNDONE", categoryId);
    }

    /**
     * Намиране на категория по ID (само активни)
     */
    @Transactional(readOnly = true)
    public Category findById(Long categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new IllegalArgumentException("Category ID must be a positive number");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with ID: " + categoryId));

        // Проверка дали е активна
        if (category.isDeleted()) {
            throw new CategoryNotFoundException("Category is archived");
        }

        return category;
    }

    /**
     * Намиране на категория принадлежаща на потребител (само активни)
     */
    @Transactional(readOnly = true)
    public Category findUserCategory(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .filter(category -> !category.isDeleted())
                .orElseThrow(() -> new CategoryNotFoundException("Active category not found or access denied"));
    }

    /**
     * Намиране на категория принадлежаща на потребител (включително архивирани)
     */
    @Transactional(readOnly = true)
    public Category findUserCategoryIncludingDeleted(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found or access denied"));
    }

    /**
     * Всички АКТИВНИ категории на потребител
     */
    @Transactional(readOnly = true)
    public List<Category> findUserCategories(Long userId) {
        userService.findById(userId); // Валидиране че потребителят съществува
        return categoryRepository.findByUserIdOrderByName(userId);
    }

    /**
     * Всички категории на потребител (включително архивирани - за reports)
     */
    @Transactional(readOnly = true)
    public List<Category> findAllUserCategories(Long userId) {
        userService.findById(userId);
        return categoryRepository.findAllByUserId(userId);
    }

    /**
     * Архивирани категории на потребител
     */
    @Transactional(readOnly = true)
    public List<Category> findDeletedUserCategories(Long userId) {
        userService.findById(userId);
        return categoryRepository.findDeletedByUserId(userId);
    }

    /**
     * Активни категории по тип
     */
    @Transactional(readOnly = true)
    public List<Category> findUserCategoriesByType(Long userId, TransactionType type) {
        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }

        userService.findById(userId);
        return categoryRepository.findByUserIdAndType(userId, type);
    }

    /**
     * Всички категории по тип (включително архивирани)
     */
    @Transactional(readOnly = true)
    public List<Category> findAllUserCategoriesByType(Long userId, TransactionType type) {
        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }

        userService.findById(userId);
        return categoryRepository.findAllByUserIdAndType(userId, type);
    }

    /**
     * Статистики за категории
     */
    @Transactional(readOnly = true)
    public CategoryStats getCategoryStats(Long userId) {
        userService.findById(userId);

        long activeCount = categoryRepository.countActiveByUserId(userId);
        long deletedCount = categoryRepository.countDeletedByUserId(userId);

        return new CategoryStats(activeCount, deletedCount);
    }

    /**
     * Създаване на предварително зададени категории за нов потребител
     */
    public void createDefaultCategoriesForUser(User user) {
        logger.info("Creating default categories for user ID: {}", user.getId());

        // Expense категории
        createDefaultCategory(user, "Храна и напитки", TransactionType.EXPENSE, "#ef4444");
        createDefaultCategory(user, "Транспорт", TransactionType.EXPENSE, "#f97316");
        createDefaultCategory(user, "Жилище", TransactionType.EXPENSE, "#eab308");
        createDefaultCategory(user, "Здравеопазване", TransactionType.EXPENSE, "#22c55e");
        createDefaultCategory(user, "Развлечения", TransactionType.EXPENSE, "#3b82f6");
        createDefaultCategory(user, "Образование", TransactionType.EXPENSE, "#8b5cf6");
        createDefaultCategory(user, "Дрехи", TransactionType.EXPENSE, "#ec4899");
        createDefaultCategory(user, "Подарци", TransactionType.EXPENSE, "#06b6d4");
        createDefaultCategory(user, "Спорт", TransactionType.EXPENSE, "#10b981");
        createDefaultCategory(user, "Други разходи", TransactionType.EXPENSE, "#6b7280");

        // Income категории
        createDefaultCategory(user, "Заплата", TransactionType.INCOME, "#16a34a");
        createDefaultCategory(user, "Бонус", TransactionType.INCOME, "#059669");
        createDefaultCategory(user, "Инвестиции", TransactionType.INCOME, "#0891b2");
        createDefaultCategory(user, "Подарък", TransactionType.INCOME, "#7c3aed");
        createDefaultCategory(user, "Други приходи", TransactionType.INCOME, "#dc2626");

        logger.info("Successfully created default categories for user ID: {}", user.getId());
    }

    // ===== HELPER CLASSES =====

    public static class CategoryStats {
        private final long activeCount;
        private final long archivedCount;

        public CategoryStats(long activeCount, long archivedCount) {
            this.activeCount = activeCount;
            this.archivedCount = archivedCount;
        }

        public long getActiveCount() { return activeCount; }
        public long getArchivedCount() { return archivedCount; }
        public long getTotalCount() { return activeCount + archivedCount; }
    }

    // ===== PRIVATE HELPER METHODS =====

    private void validateCategoryInput(String name, TransactionType type) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Category name is required");
        }
        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }
        if (name.trim().length() > 100) {
            throw new IllegalArgumentException("Category name cannot exceed 100 characters");
        }
    }

    private String validateAndSetColor(String color) {
        if (!StringUtils.hasText(color)) {
            return "#6366f1"; // Default color
        }

        String trimmedColor = color.trim();

        // Базова валидация за HEX цвят
        if (!trimmedColor.startsWith("#") || trimmedColor.length() != 7) {
            return "#6366f1"; // Default color ако форматът не е правилен
        }

        return trimmedColor;
    }
}