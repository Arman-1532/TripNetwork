-- Review table for package reviews
CREATE TABLE IF NOT EXISTS review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    traveler_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES package(package_id) ON DELETE CASCADE,
    FOREIGN KEY (traveler_id) REFERENCES user(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_traveler (package_id, traveler_id)
);