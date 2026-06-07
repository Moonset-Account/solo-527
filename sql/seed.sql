INSERT INTO channels (id, name, total_samples, quality_score, pending_review, fast_answer_count, duplicate_submission_count, device_concentration_count, skip_abnormal_count, open_copy_count, updated_at) VALUES
('ch-001', '微信朋友圈', 856, 78, 12, 23, 8, 15, 18, 10, NOW()),
('ch-002', '抖音信息流', 1245, 72, 28, 45, 22, 31, 27, 19, NOW()),
('ch-003', '小红书种草', 632, 85, 6, 12, 3, 7, 9, 5, NOW()),
('ch-004', '百度SEM', 421, 68, 15, 18, 12, 14, 11, 8, NOW()),
('ch-005', '电商平台弹窗', 967, 82, 9, 19, 5, 11, 13, 7, NOW());

INSERT INTO samples (id, channel_id, channel_name, total_duration, device_id, ip_region, abnormal_types, status, question_group_durations, skip_pattern, open_answers, submitted_at) VALUES
('s-001', 'ch-001', '微信朋友圈', 42, 'dev-abc123', '广东省深圳市', ARRAY['fast_answer', 'open_copy']::varchar[], 'pending', ARRAY[8, 12, 7, 10, 5], ARRAY[false, false, false, true, false], '["产品不错，值得购买"]', NOW() - INTERVAL '1 hour'),
('s-002', 'ch-001', '微信朋友圈', 156, 'dev-def456', '北京市朝阳区', ARRAY['skip_abnormal']::varchar[], 'approved', ARRAY[15, 28, 22, 18, 73], ARRAY[false, true, false, false, false], '["使用体验很好，推荐给朋友"]', NOW() - INTERVAL '2 hours'),
('s-003', 'ch-002', '抖音信息流', 38, 'dev-ghi789', '上海市浦东新区', ARRAY['fast_answer']::varchar[], 'pending', ARRAY[5, 8, 6, 9, 10], ARRAY[false, false, false, false, false], '["很好"]', NOW() - INTERVAL '30 minutes'),
('s-004', 'ch-002', '抖音信息流', 450, 'dev-jkl012', '浙江省杭州市', ARRAY['duplicate_submission', 'device_concentration']::varchar[], 'pending', ARRAY[42, 68, 55, 48, 237], ARRAY[false, false, false, false, false], '["产品功能齐全，满足我的需求"]', NOW() - INTERVAL '45 minutes'),
('s-005', 'ch-002', '抖音信息流', 452, 'dev-jkl012', '浙江省杭州市', ARRAY['duplicate_submission', 'device_concentration']::varchar[], 'pending', ARRAY[40, 70, 52, 50, 240], ARRAY[false, false, false, false, false], '["产品功能齐全，满足我的需求"]', NOW() - INTERVAL '46 minutes'),
('s-006', 'ch-003', '小红书种草', 210, 'dev-mno345', '四川省成都市', ARRAY['device_concentration']::varchar[], 'rejected', ARRAY[25, 38, 32, 28, 87], ARRAY[false, false, false, false, false], '["颜值很高，非常喜欢"]', NOW() - INTERVAL '3 hours'),
('s-007', 'ch-004', '百度SEM', 89, 'dev-pqr678', '江苏省南京市', ARRAY['fast_answer', 'skip_abnormal']::varchar[], 'pending', ARRAY[10, 15, 12, 18, 34], ARRAY[true, false, true, false, false], '["还可以"]', NOW() - INTERVAL '1.5 hours'),
('s-008', 'ch-005', '电商平台弹窗', 320, 'dev-stu901', '湖北省武汉市', ARRAY['open_copy']::varchar[], 'approved', ARRAY[35, 48, 42, 38, 157], ARRAY[false, false, false, false, false], '["性价比很高，下次还会购买"]', NOW() - INTERVAL '5 hours');

INSERT INTO review_queue (id, sample_id, channel_id, channel_name, abnormal_types, marked_at, status) VALUES
('rq-001', 's-001', 'ch-001', '微信朋友圈', ARRAY['fast_answer', 'open_copy']::varchar[], NOW() - INTERVAL '1 hour', 'pending'),
('rq-002', 's-003', 'ch-002', '抖音信息流', ARRAY['fast_answer']::varchar[], NOW() - INTERVAL '30 minutes', 'pending'),
('rq-003', 's-004', 'ch-002', '抖音信息流', ARRAY['duplicate_submission', 'device_concentration']::varchar[], NOW() - INTERVAL '45 minutes', 'pending'),
('rq-004', 's-005', 'ch-002', '抖音信息流', ARRAY['duplicate_submission', 'device_concentration']::varchar[], NOW() - INTERVAL '46 minutes', 'pending'),
('rq-005', 's-007', 'ch-004', '百度SEM', ARRAY['fast_answer', 'skip_abnormal']::varchar[], NOW() - INTERVAL '1.5 hours', 'pending');
