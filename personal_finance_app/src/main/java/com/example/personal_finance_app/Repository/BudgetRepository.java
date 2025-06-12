package com.example.personal_finance_app.Repository;


import com.example.personal_finance_app.Entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserId(Long userId);

    List<Budget> findByUserIdAndBudgetYearAndBudgetMonth(Long userId, Integer year, Integer month);

    Optional<Budget> findByUserIdAndCategoryIdAndBudgetYearAndBudgetMonth(
            Long userId, Long categoryId, Integer year, Integer month);

    // За общия месечен бюджет (category_id е NULL)
    Optional<Budget> findByUserIdAndCategoryIsNullAndBudgetYearAndBudgetMonth(
            Long userId, Integer year, Integer month);
}