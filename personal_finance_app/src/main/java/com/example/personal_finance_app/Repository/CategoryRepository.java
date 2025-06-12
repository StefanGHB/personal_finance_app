package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Enum.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserId(Long userId);

    List<Category> findByUserIdAndType(Long userId, TransactionType type);

    List<Category> findByUserIdOrderByName(Long userId);
}