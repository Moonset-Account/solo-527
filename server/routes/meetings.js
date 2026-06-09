const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { ok, fail, asyncHandler } = require('../utils/common');
const meetingSvc = require('../services/meetingService');

if (!fs.existsSync(config.upload.path)) fs.mkdirSync(config.upload.path, { recursive: true });
const upload = multer({ dest: config.upload.path, limits: { fileSize: config.upload.maxSize } });

router.get('/', asyncHandler(async (req, res) => {
  const { status, project, keyword, limit, offset } = req.query;
  const meetings = meetingSvc.listMeetings({
    status, project, keyword,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });
  ok(res, { items: meetings, total: meetings.length });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const detail = meetingSvc.getMeetingDetail(req.params.id);
  if (!detail) return fail(res, 'Meeting not found', 404, 404);
  ok(res, detail);
}));

router.post('/import', upload.single('file'), asyncHandler(async (req, res) => {
  let rawContent = req.body.content;
  let sourceFormat = req.body.format || 'auto';
  let source = 'api';
  let filename = null;

  if (req.file) {
    rawContent = fs.readFileSync(req.file.path, 'utf8');
    filename = req.file.originalname;
    source = `upload:${filename}`;
    if (filename.endsWith('.vtt')) sourceFormat = 'vtt';
    else if (filename.endsWith('.srt')) sourceFormat = 'srt';
    fs.promises.unlink(req.file.path).catch(() => {});
  }

  if (!rawContent) return fail(res, '缺少转写内容 content 或文件上传', 400, 400);

  const result = await meetingSvc.importTranscript({
    title: req.body.title || filename || `导入会议_${new Date().toISOString().slice(0, 10)}`,
    projectName: req.body.project_name || null,
    meetingDate: req.body.meeting_date || new Date().toISOString().slice(0, 10),
    duration: req.body.duration ? parseInt(req.body.duration) : null,
    location: req.body.location || null,
    rawContent,
    sourceFormat,
    source,
    metadata: { filename },
    operatorName: req.body.operator || 'api',
  });

  ok(res, result, '导入成功，已提交解析与抽取任务');
}));

router.post('/:id/re-extract', asyncHandler(async (req, res) => {
  const queue = require('../queue');
  const { getDb } = require('../db');
  const { now } = require('../utils/common');
  const db = getDb();
  const m = db.prepare('SELECT id FROM meetings WHERE id = ?').get(req.params.id);
  if (!m) return fail(res, 'Meeting not found', 404, 404);
  db.prepare('DELETE FROM action_items WHERE meeting_id = ?').run(req.params.id);
  db.prepare('DELETE FROM topics WHERE meeting_id = ?').run(req.params.id);
  db.prepare(`UPDATE meetings SET status = 'parsed', updated_at = ? WHERE id = ?`).run(now(), req.params.id);
  await queue.addJob(queue.QUEUE_NAMES.ACTION_EXTRACT, { meetingId: req.params.id });
  ok(res, { meetingId: req.params.id }, '已重新提交抽取任务');
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  try {
    const updated = meetingSvc.updateMeeting(req.params.id, req.body, req.body.operator || 'api');
    ok(res, updated);
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  meetingSvc.deleteMeeting(req.params.id, req.query.operator || 'api');
  ok(res, { id: req.params.id }, '已删除');
}));

router.get('/:id/speakers', asyncHandler(async (req, res) => {
  ok(res, { items: meetingSvc.getSpeakers(req.params.id) });
}));

router.post('/speakers/:id/confirm', asyncHandler(async (req, res) => {
  try {
    meetingSvc.confirmSpeaker(
      req.params.id,
      req.body.name,
      req.body.role || null,
      req.body.operator || 'api'
    );
    ok(res, { speakerId: req.params.id });
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

module.exports = router;
