package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Enum.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // ===== АКТИВНИ КАТЕГОРИИ (за нормалната употреба) =====

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.name")
    List<Category> findByUserIdOrderByName(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.type = :type AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.name")
    List<Category> findByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND (c.isDeleted = false OR c.isDeleted IS NULL)")
    List<Category> findByUserId(@Param("userId") Long userId);

    // ===== ВСИЧКИ КАТЕГОРИИ (включително deleted - за reports и statistics) =====

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId ORDER BY c.name")
    List<Category> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.type = :type ORDER BY c.name")
    List<Category> findAllByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    // ===== ARCHIVED/DELETED КАТЕГОРИИ (за restore функционалност) =====

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.isDeleted = true ORDER BY c.deletedAt DESC")
    List<Category> findDeletedByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.type = :type AND c.isDeleted = true ORDER BY c.deletedAt DESC")
    List<Category> findDeletedByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    // ===== СПЕЦИФИЧЕН LOOKUP (за findById и security проверки) =====

    @Query("SELECT c FROM Category c WHERE c.id = :id AND c.user.id = :userId")
    Optional<Category> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // ===== COUNT QUERIES =====

    @Query("SELECT COUNT(c) FROM Category c WHERE c.user.id = :userId AND (c.isDeleted = false OR c.isDeleted IS NULL)")
    long countActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.user.id = :userId AND c.isDeleted = true")
    long countDeletedByUserId(@Param("userId") Long userId);
}