package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.BudgetAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetAlertRepository extends JpaRepository<BudgetAlert, Long> {

    List<BudgetAlert> findByUserId(Long userId);

    List<BudgetAlert> findByUserIdAndIsRead(Long userId, Boolean isRead);

    List<BudgetAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
}