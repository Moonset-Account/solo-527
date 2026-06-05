from app import db
from app.models import Mentor, Student, IndustryTag

class MatchingService:
    @staticmethod
    def calculate_match_score(student, mentor):
        score = 0
        
        if student.target_industries and mentor.industry_tags:
            common_industries = set(student.target_industries) & set(mentor.industry_tags)
            if common_industries:
                score += len(common_industries) * 20
        
        if student.school == mentor.school:
            score += 15
        
        if student.department == mentor.department:
            score += 10
        
        if mentor.average_rating:
            score += mentor.average_rating * 2
        
        score += min(mentor.years_of_experience * 0.5, 10)
        score += min(mentor.total_meetings * 0.1, 10)
        
        return min(score, 100)
    
    @staticmethod
    def get_recommendations(student_id, limit=10):
        student = db.session.get(Student, student_id)
        if not student:
            raise ValueError('Student not found')
        
        mentors = Mentor.query.filter_by(review_status='approved').all()
        
        scored_mentors = []
        for mentor in mentors:
            score = MatchingService.calculate_match_score(student, mentor)
            scored_mentors.append({
                'mentor': mentor.to_dict(),
                'match_score': score,
                'match_reasons': MatchingService._get_match_reasons(student, mentor)
            })
        
        scored_mentors.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_mentors[:limit]
    
    @staticmethod
    def _get_match_reasons(student, mentor):
        reasons = []
        
        if student.target_industries and mentor.industry_tags:
            common = set(student.target_industries) & set(mentor.industry_tags)
            if common:
                reasons.append(f'匹配行业标签: {", ".join(list(common)[:3])}')
        
        if student.school == mentor.school:
            reasons.append('同校校友')
        
        if student.department == mentor.department:
            reasons.append('同院系')
        
        if mentor.average_rating >= 4.5:
            reasons.append(f'高评分导师 ({mentor.average_rating:.1f})')
        
        if mentor.years_of_experience >= 5:
            reasons.append(f'{mentor.years_of_experience}年工作经验')
        
        return reasons
    
    @staticmethod
    def get_mentor_student_matches(mentor_id, limit=10):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        
        students = Student.query.filter_by(review_status='approved').all()
        
        scored_students = []
        for student in students:
            score = MatchingService.calculate_match_score(student, mentor)
            scored_students.append({
                'student': student.to_dict(),
                'match_score': score
            })
        
        scored_students.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_students[:limit]
