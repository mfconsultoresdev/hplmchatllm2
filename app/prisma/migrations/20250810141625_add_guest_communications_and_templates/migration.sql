-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "date_of_birth" DATE,
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "shift_type" TEXT NOT NULL DEFAULT 'DAY',
    "salary_type" TEXT NOT NULL DEFAULT 'HOURLY',
    "base_salary" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "can_login" BOOLEAN NOT NULL DEFAULT false,
    "access_level" TEXT NOT NULL DEFAULT 'BASIC',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "id_document" TEXT,
    "tax_id" TEXT,
    "work_permit" TEXT,
    "profile_photo" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_schedules" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "schedule_date" DATE NOT NULL,
    "shift_start" TIMESTAMP(3) NOT NULL,
    "shift_end" TIMESTAMP(3) NOT NULL,
    "break_start" TIMESTAMP(3),
    "break_end" TIMESTAMP(3),
    "schedule_type" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_hours" DECIMAL(4,2) NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 30,
    "assigned_areas" JSONB,
    "special_tasks" TEXT,
    "notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "clock_in" TIMESTAMP(3),
    "clock_out" TIMESTAMP(3),
    "break_start" TIMESTAMP(3),
    "break_end" TIMESTAMP(3),
    "scheduled_hours" DECIMAL(4,2),
    "actual_hours" DECIMAL(4,2),
    "overtime_hours" DECIMAL(4,2),
    "break_minutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "absence_type" TEXT,
    "absence_reason" TEXT,
    "is_excused" BOOLEAN NOT NULL DEFAULT false,
    "productivity_rating" INTEGER,
    "tasks_completed" JSONB,
    "performance_notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "attendance_id" TEXT,
    "entry_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "entry_type" TEXT NOT NULL,
    "task_category" TEXT,
    "task_description" TEXT,
    "location" TEXT,
    "duration_minutes" INTEGER,
    "billable_hours" DECIMAL(4,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_evaluations" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "evaluation_period_start" DATE NOT NULL,
    "evaluation_period_end" DATE NOT NULL,
    "evaluation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluation_type" TEXT NOT NULL DEFAULT 'PERFORMANCE',
    "evaluator_id" TEXT NOT NULL,
    "evaluator_name" TEXT NOT NULL,
    "overall_rating" DECIMAL(2,1),
    "punctuality" INTEGER,
    "quality_of_work" INTEGER,
    "teamwork" INTEGER,
    "communication" INTEGER,
    "initiative" INTEGER,
    "reliability" INTEGER,
    "customer_service" INTEGER,
    "strengths" TEXT,
    "areas_improvement" TEXT,
    "goals_objectives" TEXT,
    "training_needs" TEXT,
    "recommendation" TEXT,
    "salary_adjustment" DECIMAL(10,2),
    "promotion_eligible" BOOLEAN NOT NULL DEFAULT false,
    "next_review_date" DATE,
    "action_plan" TEXT,
    "employee_comments" TEXT,
    "employee_signed" BOOLEAN NOT NULL DEFAULT false,
    "employee_sign_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "staff_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "language" TEXT NOT NULL DEFAULT 'es',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "trigger_event" TEXT,
    "send_delay_hours" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "sender_id" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL DEFAULT 'STAFF',
    "guest_id" TEXT,
    "reservation_id" TEXT,
    "department" TEXT,
    "position" TEXT,
    "send_to_all" BOOLEAN NOT NULL DEFAULT false,
    "template_id" TEXT,
    "template_variables" JSONB,
    "delivery_method" TEXT NOT NULL DEFAULT 'INTERNAL',
    "scheduled_send" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3),
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "parent_message_id" TEXT,
    "thread_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_recipients" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "reply_message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_communication_recipients" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "reply_message" TEXT,
    "contact_method" TEXT NOT NULL DEFAULT 'PORTAL',
    "contact_value" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_communication_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "delivery_method" TEXT NOT NULL DEFAULT 'PUSH',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "action_url" TEXT,
    "action_data" JSONB,
    "expires_at" TIMESTAMP(3),
    "auto_dismiss" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_employee_number_key" ON "staff"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schedules_hotel_id_staff_id_schedule_date_key" ON "staff_schedules"("hotel_id", "staff_id", "schedule_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_hotel_id_staff_id_attendance_date_key" ON "staff_attendance"("hotel_id", "staff_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "communication_recipients_message_id_staff_id_key" ON "communication_recipients"("message_id", "staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_communication_recipients_message_id_guest_id_key" ON "guest_communication_recipients"("message_id", "guest_id");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "staff_attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_evaluations" ADD CONSTRAINT "staff_evaluations_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_evaluations" ADD CONSTRAINT "staff_evaluations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "communication_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_recipients" ADD CONSTRAINT "communication_recipients_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_communication_recipients" ADD CONSTRAINT "guest_communication_recipients_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_communication_recipients" ADD CONSTRAINT "guest_communication_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_communication_recipients" ADD CONSTRAINT "guest_communication_recipients_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_communication_recipients" ADD CONSTRAINT "guest_communication_recipients_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notification_staff_fkey" FOREIGN KEY ("recipient_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notification_guest_fkey" FOREIGN KEY ("recipient_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
