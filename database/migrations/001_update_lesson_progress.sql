-- Міграція для оновлення таблиці lesson_progress
-- Додавання нових полів для розширеного відстеження прогресу

-- Додавання нових колонок до таблиці lesson_progress
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS last_position JSONB, -- Позиція в уроці (слайд, час аудіо)
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Оновлення існуючих записів - встановлення course_id з lessons
UPDATE lesson_progress 
SET course_id = l.course_id 
FROM lessons l 
WHERE lesson_progress.lesson_id = l.id 
AND lesson_progress.course_id IS NULL;

-- Створення індексів для нових полів
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_progress ON lesson_progress(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_updated_at ON lesson_progress(updated_at);

-- Створення тригера для автоматичного оновлення updated_at
CREATE TRIGGER update_lesson_progress_updated_at 
BEFORE UPDATE ON lesson_progress 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Оновлення прогресу для існуючих записів (якщо є completed_at, то 100%)
UPDATE lesson_progress 
SET progress_percentage = 100 
WHERE completed_at IS NOT NULL AND progress_percentage = 0;

COMMIT;