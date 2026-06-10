package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.courselearning.common.ResultCode;
import com.courselearning.entity.Chapter;
import com.courselearning.entity.Course;
import com.courselearning.mapper.ChapterMapper;
import com.courselearning.mapper.CourseMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChapterService {

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private CourseMapper courseMapper;

    public List<Chapter> getChapterList(Long courseId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Chapter::getCourseId, courseId)
                .orderByAsc(Chapter::getChapterOrder);
        return chapterMapper.selectList(wrapper);
    }

    public Chapter getChapterById(Long id) {
        return chapterMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void createChapter(Chapter chapter) {
        Course course = courseMapper.selectById(chapter.getCourseId());
        if (course == null) {
            throw new RuntimeException(ResultCode.COURSE_NOT_EXIST.getMessage());
        }
        chapter.setStatus(1);
        chapter.setCreatedAt(LocalDateTime.now());
        chapter.setUpdatedAt(LocalDateTime.now());
        if (chapter.getChapterOrder() == null) {
            LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Chapter::getCourseId, chapter.getCourseId());
            Long count = chapterMapper.selectCount(wrapper);
            chapter.setChapterOrder(count.intValue() + 1);
        }
        chapterMapper.insert(chapter);
        updateCourseChapterCount(chapter.getCourseId());
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateChapter(Long id, Chapter chapter) {
        Chapter exist = chapterMapper.selectById(id);
        if (exist == null) {
            throw new RuntimeException(ResultCode.CHAPTER_NOT_EXIST.getMessage());
        }
        chapter.setId(id);
        chapter.setUpdatedAt(LocalDateTime.now());
        chapterMapper.updateById(chapter);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteChapter(Long id) {
        Chapter exist = chapterMapper.selectById(id);
        if (exist == null) {
            throw new RuntimeException(ResultCode.CHAPTER_NOT_EXIST.getMessage());
        }
        chapterMapper.deleteById(id);
        updateCourseChapterCount(exist.getCourseId());
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> setPreview(Long id, Integer isPreview, Integer previewDuration) {
        Chapter chapter = chapterMapper.selectById(id);
        if (chapter == null) {
            throw new RuntimeException(ResultCode.CHAPTER_NOT_EXIST.getMessage());
        }
        chapter.setIsPreview(isPreview);
        if (previewDuration != null) {
            chapter.setPreviewDuration(previewDuration);
        }
        chapter.setUpdatedAt(LocalDateTime.now());
        chapterMapper.updateById(chapter);
        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("isPreview", isPreview);
        result.put("previewDuration", chapter.getPreviewDuration());
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateChapterOrder(Long courseId, List<Map<String, Object>> orderList) {
        for (Map<String, Object> item : orderList) {
            Long chapterId = Long.valueOf(item.get("id").toString());
            Integer order = Integer.valueOf(item.get("chapterOrder").toString());
            Chapter chapter = new Chapter();
            chapter.setId(chapterId);
            chapter.setChapterOrder(order);
            chapter.setUpdatedAt(LocalDateTime.now());
            chapterMapper.updateById(chapter);
        }
    }

    private void updateCourseChapterCount(Long courseId) {
        LambdaQueryWrapper<Chapter> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Chapter::getCourseId, courseId);
        Long count = chapterMapper.selectCount(wrapper);
        Course course = new Course();
        course.setId(courseId);
        course.setTotalChapters(count.intValue());
        courseMapper.updateById(course);
    }
}
