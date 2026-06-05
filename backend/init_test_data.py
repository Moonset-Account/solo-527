#!/usr/bin/env python3
"""
初始化测试数据脚本
创建管理员、导师、学生、时段、预约等完整测试数据
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app import create_app, db
from app.models import (
    User, Student, Mentor, IndustryTag,
    TimeSlot, Appointment, Notification,
    Attachment, AuditLog, Feedback
)

def init_test_data():
    app = create_app()
    with app.app_context():
        print("🗑️  清理现有数据...")
        db.drop_all()
        db.create_all()
        print("✅ 数据库表已重建")
        
        print("\n📋 创建行业标签...")
        industries = [
            {'name': '互联网/科技', 'description': '互联网、软件开发、人工智能'},
            {'name': '金融/投资', 'description': '银行、证券、基金、投资'},
            {'name': '咨询/管理', 'description': '管理咨询、战略咨询'},
            {'name': '教育/培训', 'description': '教育行业、培训'},
            {'name': '医疗/健康', 'description': '医疗、医药、健康'},
        ]
        tags = []
        for ind in industries:
            tag = IndustryTag(name=ind['name'], description=ind['description'])
            db.session.add(tag)
            tags.append(tag)
        db.session.flush()
        print(f"✅ 创建了 {len(tags)} 个行业标签")
        
        print("\n👤 创建管理员...")
        admin = User(
            email='admin@example.com',
            name='系统管理员',
            phone='13800000000',
            role='admin',
            status='approved'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.flush()
        print(f"✅ 管理员创建成功: admin@example.com / admin123")
        
        print("\n🎓 创建导师...")
        mentors_data = [
            {
                'email': 'mentor1@example.com',
                'name': '张导师',
                'password': 'mentor123',
                'alumni_id': 'ALU2020001',
                'graduation_year': 2020,
                'school': '清华大学',
                'department': '计算机科学与技术系',
                'major': '软件工程',
                'current_company': '阿里巴巴',
                'current_position': '高级工程师',
                'years_of_experience': 5,
                'industry_tags': [tags[0].id],
                'expertise_areas': ['后端开发', '系统架构'],
                'review_status': 'approved',
                'rating': 4.8,
                'total_meetings': 12
            },
            {
                'email': 'mentor2@example.com',
                'name': '李导师',
                'password': 'mentor123',
                'alumni_id': 'ALU2018001',
                'graduation_year': 2018,
                'school': '北京大学',
                'department': '光华管理学院',
                'major': '金融学',
                'current_company': '红杉资本',
                'current_position': '投资经理',
                'years_of_experience': 7,
                'industry_tags': [tags[1].id],
                'expertise_areas': ['风险投资', '创业指导'],
                'review_status': 'approved',
                'rating': 4.9,
                'total_meetings': 25
            },
            {
                'email': 'mentor3@example.com',
                'name': '王导师',
                'password': 'mentor123',
                'alumni_id': 'ALU2019001',
                'graduation_year': 2019,
                'school': '复旦大学',
                'department': '新闻学院',
                'major': '传播学',
                'current_company': '麦肯锡',
                'current_position': '咨询顾问',
                'years_of_experience': 6,
                'industry_tags': [tags[2].id],
                'expertise_areas': ['品牌咨询', '市场策略'],
                'review_status': 'pending',
                'rating': 0,
                'total_meetings': 0
            }
        ]
        
        mentors = []
        for m_data in mentors_data:
            user = User(
                email=m_data['email'],
                name=m_data['name'],
                phone='138' + str(10000000 + len(mentors)),
                role='mentor',
                status=m_data['review_status']
            )
            user.set_password(m_data['password'])
            db.session.add(user)
            db.session.flush()
            
            mentor = Mentor(
                user_id=user.id,
                alumni_id=m_data['alumni_id'],
                graduation_year=m_data['graduation_year'],
                school=m_data['school'],
                department=m_data['department'],
                major=m_data['major'],
                current_company=m_data['current_company'],
                current_position=m_data['current_position'],
                years_of_experience=m_data['years_of_experience'],
                industry_tags=m_data['industry_tags'],
                expertise_areas=m_data['expertise_areas'],
                review_status=m_data['review_status'],
                average_rating=m_data['rating'],
                total_meetings=m_data['total_meetings'],
                bio=f'我是{m_data["name"]}，毕业于{m_data["school"]}，现任职于{m_data["current_company"]}。',
                reviewed_by=admin.id if m_data['review_status'] == 'approved' else None
            )
            db.session.add(mentor)
            mentors.append(mentor)
        db.session.flush()
        print(f"✅ 创建了 {len(mentors)} 个导师 (2个已审核, 1个待审核)")
        
        print("\n👨‍🎓 创建学生...")
        students_data = [
            {
                'email': 'student1@example.com',
                'name': '陈学生',
                'password': 'student123',
                'student_id': 'STU2021001',
                'school': '清华大学',
                'department': '计算机科学与技术系',
                'major': '计算机科学',
                'grade': '大三',
                'expected_graduation': '2025-06',
                'target_industries': [tags[0].id],
                'target_positions': ['软件工程师', '算法工程师'],
                'review_status': 'approved'
            },
            {
                'email': 'student2@example.com',
                'name': '刘学生',
                'password': 'student123',
                'student_id': 'STU2022001',
                'school': '北京大学',
                'department': '光华管理学院',
                'major': '金融学',
                'grade': '大二',
                'expected_graduation': '2026-06',
                'target_industries': [tags[1].id],
                'target_positions': ['投资分析师', '投行'],
                'review_status': 'approved'
            },
            {
                'email': 'student3@example.com',
                'name': '赵学生',
                'password': 'student123',
                'student_id': 'STU2023001',
                'school': '复旦大学',
                'department': '新闻学院',
                'major': '传播学',
                'grade': '大一',
                'expected_graduation': '2027-06',
                'target_industries': [tags[2].id],
                'target_positions': ['品牌策划', '市场专员'],
                'review_status': 'pending'
            }
        ]
        
        students = []
        for s_data in students_data:
            user = User(
                email=s_data['email'],
                name=s_data['name'],
                phone='139' + str(10000000 + len(students)),
                role='student',
                status=s_data['review_status']
            )
            user.set_password(s_data['password'])
            db.session.add(user)
            db.session.flush()
            
            student = Student(
                user_id=user.id,
                student_id=s_data['student_id'],
                school=s_data['school'],
                department=s_data['department'],
                major=s_data['major'],
                grade=s_data['grade'],
                expected_graduation=datetime.strptime(s_data['expected_graduation'], '%Y-%m').date(),
                target_industries=s_data['target_industries'],
                target_positions=s_data['target_positions'],
                review_status=s_data['review_status'],
                bio=f'我是{s_data["name"]}，就读于{s_data["school"]}{s_data["grade"]}，对{s_data["target_positions"][0]}方向感兴趣。',
                reviewed_by=admin.id if s_data['review_status'] == 'approved' else None
            )
            db.session.add(student)
            students.append(student)
        db.session.flush()
        print(f"✅ 创建了 {len(students)} 个学生 (2个已审核, 1个待审核)")
        
        print("\n📅 创建导师时段...")
        time_slots = []
        now = datetime.utcnow()
        for i, mentor in enumerate(mentors[:2]):
            for day_offset in [1, 2, 3, 5, 7]:
                start_time = now + timedelta(days=day_offset, hours=14 + i)
                end_time = start_time + timedelta(hours=1)
                slot = TimeSlot(
                    mentor_id=mentor.id,
                    start_time=start_time,
                    end_time=end_time,
                    is_booked=False,
                    is_recurring=False
                )
                db.session.add(slot)
                time_slots.append(slot)
            
            booked_slot = TimeSlot(
                mentor_id=mentor.id,
                start_time=now + timedelta(days=4, hours=15 + i),
                end_time=now + timedelta(days=4, hours=16 + i),
                is_booked=True,
                is_recurring=False
            )
            db.session.add(booked_slot)
            time_slots.append(booked_slot)
        db.session.flush()
        print(f"✅ 创建了 {len(time_slots)} 个时段")
        
        print("\n📅 创建预约数据...")
        appointments_data = [
            {
                'student': students[0],
                'mentor': mentors[0],
                'time_slot': time_slots[5],
                'title': '职业发展咨询',
                'description': '想了解互联网行业的职业发展路径',
                'topics': ['职业规划', '技术栈选择'],
                'status': 'pending',
                'meeting_type': 'online'
            },
            {
                'student': students[1],
                'mentor': mentors[1],
                'time_slot': time_slots[11],
                'title': '面试经验分享',
                'description': '希望了解金融行业面试技巧',
                'topics': ['面试技巧', '简历优化'],
                'status': 'confirmed',
                'meeting_type': 'offline'
            },
            {
                'student': students[0],
                'mentor': mentors[0],
                'title': '技术面试辅导',
                'description': '系统设计面试辅导',
                'topics': ['系统设计', '算法'],
                'status': 'completed',
                'meeting_type': 'online',
                'started_at': now - timedelta(days=7, hours=1),
                'ended_at': now - timedelta(days=7),
                'contact_unlocked': True,
                'contact_unlocked_at': now - timedelta(days=7)
            }
        ]
        
        appointments = []
        for i, a_data in enumerate(appointments_data):
            appointment = Appointment(
                student_id=a_data['student'].id,
                mentor_id=a_data['mentor'].id,
                time_slot_id=a_data.get('time_slot', time_slots[i * 2]).id,
                title=a_data['title'],
                description=a_data['description'],
                topics=a_data['topics'],
                status=a_data['status'],
                meeting_type=a_data['meeting_type'],
                meeting_link=f'https://meet.example.com/appointment/{i+1}' if a_data['meeting_type'] == 'online' else None,
                meeting_location='中关村创业大街 3W咖啡' if a_data['meeting_type'] == 'offline' else None,
                qr_code=f'uploads/qrcodes/appointment_{i+1}.png',
                started_at=a_data.get('started_at'),
                ended_at=a_data.get('ended_at'),
                contact_unlocked=a_data.get('contact_unlocked', False),
                contact_unlocked_at=a_data.get('contact_unlocked_at')
            )
            db.session.add(appointment)
            appointments.append(appointment)
        db.session.flush()
        print(f"✅ 创建了 {len(appointments)} 个预约 (待确认/已确认/已完成)")
        
        print("\n📝 创建反馈数据...")
        for appointment in appointments:
            if appointment.status == 'completed':
                feedback = Feedback(
                    appointment_id=appointment.id,
                    student_id=appointment.student_id,
                    mentor_id=appointment.mentor_id,
                    student_rating=5,
                    student_comment='导师非常专业，给出了很多实用建议！',
                    student_answers={'question_1': '非常有帮助', 'question_2': '5分'},
                    student_submitted_at=appointment.ended_at + timedelta(hours=2),
                    is_complete=True
                )
                db.session.add(feedback)
        db.session.flush()
        print("✅ 创建了反馈数据")
        
        print("\n🔔 创建通知数据...")
        notifications_data = [
            (mentors[0].user_id, 'appointment_request', '新的预约请求', '陈学生 预约了您明天的时段', 'appointment', appointments[0].id),
            (students[0].user_id, 'appointment_confirmed', '预约已确认', '您的预约「职业发展咨询」已被导师确认', 'appointment', appointments[0].id),
            (mentors[0].user_id, 'review_approved', '资料审核通过', '您的导师资料已通过审核', 'mentor', mentors[0].id),
            (students[0].user_id, 'review_approved', '资料审核通过', '您的学生资料已通过审核', 'student', students[0].id),
            (mentors[0].user_id, 'system', '欢迎加入', '欢迎加入校友导师平台！', None, None),
        ]
        
        for n_data in notifications_data:
            notification = Notification(
                user_id=n_data[0],
                type=n_data[1],
                title=n_data[2],
                content=n_data[3],
                related_type=n_data[4],
                related_id=n_data[5],
                is_read=False
            )
            db.session.add(notification)
        db.session.flush()
        print(f"✅ 创建了 {len(notifications_data)} 条通知")
        
        print("\n📎 创建附件数据...")
        attachments = [
            {
                'appointment_id': appointments[2].id,
                'uploaded_by': students[0].user_id,
                'file_name': '简历.pdf',
                'file_path': 'uploads/resumes/resume_1.pdf',
                'file_size': 102400,
                'file_type': 'application/pdf',
                'description': '个人简历'
            },
            {
                'appointment_id': appointments[2].id,
                'uploaded_by': students[0].user_id,
                'file_name': '项目介绍.pptx',
                'file_path': 'uploads/documents/project.pptx',
                'file_size': 2048000,
                'file_type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'description': '项目介绍材料',
                'is_offline_upload': True,
                'offline_sync_at': now - timedelta(days=1)
            }
        ]
        
        for att_data in attachments:
            attachment = Attachment(**att_data)
            db.session.add(attachment)
        db.session.flush()
        print(f"✅ 创建了 {len(attachments)} 个附件")
        
        print("\n📜 创建审计日志...")
        audit_logs = [
            {
                'user_id': admin.id,
                'action': 'review',
                'resource_type': 'mentor',
                'resource_id': mentors[0].id,
                'old_values': {'review_status': 'pending'},
                'new_values': {'review_status': 'approved'}
            },
            {
                'user_id': admin.id,
                'action': 'review',
                'resource_type': 'student',
                'resource_id': students[0].id,
                'old_values': {'review_status': 'pending'},
                'new_values': {'review_status': 'approved'}
            },
            {
                'user_id': students[0].user_id,
                'action': 'create',
                'resource_type': 'appointment',
                'resource_id': appointments[0].id,
                'appointment_id': appointments[0].id
            },
            {
                'user_id': mentors[0].user_id,
                'action': 'update_status',
                'resource_type': 'appointment',
                'resource_id': appointments[2].id,
                'appointment_id': appointments[2].id,
                'old_values': {'status': 'confirmed'},
                'new_values': {'status': 'completed'}
            }
        ]
        
        for log_data in audit_logs:
            audit_log = AuditLog(
                **log_data,
                ip_address='127.0.0.1',
                user_agent='Mozilla/5.0'
            )
            db.session.add(audit_log)
        db.session.commit()
        print(f"✅ 创建了 {len(audit_logs)} 条审计日志")
        
        print("\n" + "=" * 60)
        print("🎉 测试数据初始化完成！")
        print("=" * 60)
        print("\n📋 测试账号:")
        print("-" * 60)
        print(f"  管理员: admin@example.com / admin123")
        print(f"  导师1 (已审核): mentor1@example.com / mentor123")
        print(f"  导师2 (已审核): mentor2@example.com / mentor123")
        print(f"  导师3 (待审核): mentor3@example.com / mentor123")
        print(f"  学生1 (已审核): student1@example.com / student123")
        print(f"  学生2 (已审核): student2@example.com / student123")
        print(f"  学生3 (待审核): student3@example.com / student123")
        print("\n📊 数据统计:")
        print("-" * 60)
        print(f"  行业标签: {len(tags)} 个")
        print(f"  用户: 1管理员 + 3导师 + 3学生 = 7人")
        print(f"  时段: {len(time_slots)} 个")
        print(f"  预约: {len(appointments)} 个 (待确认、已确认、已完成)")
        print(f"  通知: {len(notifications_data)} 条")
        print(f"  附件: {len(attachments)} 个")
        print(f"  审计日志: {len(audit_logs)} 条")
        print("\n🚀 现在可以启动服务并测试完整流程了！")

if __name__ == '__main__':
    init_test_data()
