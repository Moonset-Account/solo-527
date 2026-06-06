import { d as defineEventHandler, U as User, T as Task, i as UserRole, j as TaskStatus, k as TaskType, l as generateTaskNumber } from '../../nitro/nitro.mjs';
import { P as Point } from '../../_/Point.mjs';
import 'jsonwebtoken';
import 'mongoose';
import 'bcryptjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';

const users = [
  {
    username: "admin",
    password: "123456",
    name: "\u5F20\u7BA1\u7406\u5458",
    phone: "13800000001",
    role: UserRole.STREET_ADMIN,
    community: "\u9633\u5149\u793E\u533A"
  },
  {
    username: "grid1",
    password: "123456",
    name: "\u674E\u7F51\u683C\u5458",
    phone: "13800000002",
    role: UserRole.GRID_MEMBER,
    community: "\u9633\u5149\u793E\u533A",
    gridArea: "A\u533A"
  },
  {
    username: "grid2",
    password: "123456",
    name: "\u738B\u7F51\u683C\u5458",
    phone: "13800000003",
    role: UserRole.GRID_MEMBER,
    community: "\u548C\u5E73\u793E\u533A",
    gridArea: "B\u533A"
  },
  {
    username: "property1",
    password: "123456",
    name: "\u8D75\u7269\u4E1A",
    phone: "13800000004",
    role: UserRole.PROPERTY,
    propertyCompany: "\u7EFF\u6E90\u7269\u4E1A"
  },
  {
    username: "property2",
    password: "123456",
    name: "\u5B59\u7269\u4E1A",
    phone: "13800000005",
    role: UserRole.PROPERTY,
    propertyCompany: "\u5B89\u5C45\u7269\u4E1A"
  },
  {
    username: "property3",
    password: "123456",
    name: "\u5468\u7269\u4E1A",
    phone: "13800000006",
    role: UserRole.PROPERTY,
    propertyCompany: "\u6052\u4FE1\u7269\u4E1A"
  }
];
const points = [
  {
    name: "1\u53F7\u5783\u573E\u6876\u70B9\u4F4D",
    address: "\u9633\u5149\u8DEF1\u53F7\u95E8\u53E3",
    community: "\u9633\u5149\u793E\u533A",
    location: { type: "Point", coordinates: [116.4074, 39.9042] },
    binTypes: ["\u53A8\u4F59\u5783\u573E", "\u5176\u4ED6\u5783\u573E", "\u53EF\u56DE\u6536\u7269", "\u6709\u5BB3\u5783\u573E"],
    propertyCompany: "\u7EFF\u6E90\u7269\u4E1A",
    contactPerson: "\u8D75\u7ECF\u7406",
    contactPhone: "13800000010"
  },
  {
    name: "2\u53F7\u5783\u573E\u6876\u70B9\u4F4D",
    address: "\u9633\u5149\u8DEF5\u53F7\u9662\u5185",
    community: "\u9633\u5149\u793E\u533A",
    location: { type: "Point", coordinates: [116.4084, 39.9052] },
    binTypes: ["\u53A8\u4F59\u5783\u573E", "\u5176\u4ED6\u5783\u573E"],
    propertyCompany: "\u7EFF\u6E90\u7269\u4E1A",
    contactPerson: "\u8D75\u7ECF\u7406",
    contactPhone: "13800000010"
  },
  {
    name: "3\u53F7\u5783\u573E\u6876\u70B9\u4F4D",
    address: "\u548C\u5E73\u88578\u53F7\u697C\u524D",
    community: "\u548C\u5E73\u793E\u533A",
    location: { type: "Point", coordinates: [116.4064, 39.9032] },
    binTypes: ["\u53A8\u4F59\u5783\u573E", "\u5176\u4ED6\u5783\u573E", "\u53EF\u56DE\u6536\u7269"],
    propertyCompany: "\u5B89\u5C45\u7269\u4E1A",
    contactPerson: "\u94B1\u7ECF\u7406",
    contactPhone: "13800000011"
  },
  {
    name: "4\u53F7\u5783\u573E\u6876\u70B9\u4F4D",
    address: "\u5E78\u798F\u5DF73\u53F7",
    community: "\u5E78\u798F\u793E\u533A",
    location: { type: "Point", coordinates: [116.4094, 39.9062] },
    binTypes: ["\u53A8\u4F59\u5783\u573E", "\u5176\u4ED6\u5783\u573E", "\u53EF\u56DE\u6536\u7269", "\u6709\u5BB3\u5783\u573E"],
    propertyCompany: "\u6052\u4FE1\u7269\u4E1A",
    contactPerson: "\u5B59\u7ECF\u7406",
    contactPhone: "13800000012"
  },
  {
    name: "5\u53F7\u5783\u573E\u6876\u70B9\u4F4D",
    address: "\u65B0\u534E\u8DEF12\u53F7",
    community: "\u65B0\u534E\u793E\u533A",
    location: { type: "Point", coordinates: [116.4054, 39.9022] },
    binTypes: ["\u53A8\u4F59\u5783\u573E", "\u5176\u4ED6\u5783\u573E"],
    propertyCompany: "\u5BB6\u5174\u7269\u4E1A",
    contactPerson: "\u674E\u7ECF\u7406",
    contactPhone: "13800000013"
  }
];
const samplePhotos = [
  { url: "https://picsum.photos/seed/waste1/600/400", caption: "\u73B0\u573A\u7167\u72471" },
  { url: "https://picsum.photos/seed/waste2/600/400", caption: "\u73B0\u573A\u7167\u72472" },
  { url: "https://picsum.photos/seed/waste3/600/400", caption: "\u6574\u6539\u540E\u7167\u72471" },
  { url: "https://picsum.photos/seed/waste4/600/400", caption: "\u6574\u6539\u540E\u7167\u72472" }
];
const seed_post = defineEventHandler(async () => {
  await User.deleteMany({});
  await Point.deleteMany({});
  await Task.deleteMany({});
  const createdUsers = await User.create(users);
  const createdPoints = await Point.create(points);
  const gridMember = createdUsers.find((u) => u.username === "grid1");
  const gridMember2 = createdUsers.find((u) => u.username === "grid2");
  const property1 = createdUsers.find((u) => u.username === "property1");
  const property2 = createdUsers.find((u) => u.username === "property2");
  const property3 = createdUsers.find((u) => u.username === "property3");
  const admin = createdUsers.find((u) => u.username === "admin");
  const point1 = createdPoints[0];
  const point2 = createdPoints[1];
  const point3 = createdPoints[2];
  const point4 = createdPoints[3];
  const point5 = createdPoints[4];
  const now = /* @__PURE__ */ new Date();
  const deadlineHours = 24;
  const tasks = [];
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point1._id,
    pointName: point1.name,
    community: point1.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u53D1\u73B0\u53A8\u4F59\u5783\u573E\u6876\u4E2D\u6709\u5927\u91CF\u5851\u6599\u74F6\u548C\u7EB8\u5DFE\uFF0C\u5C45\u6C11\u672A\u6B63\u786E\u5206\u7C7B",
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: now, caption: samplePhotos[0].caption }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() + 2 * 60 * 60 * 1e3), caption: samplePhotos[2].caption }
    ],
    status: TaskStatus.CLOSED,
    propertyCompany: point1.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: "pass",
      reason: "\u6574\u6539\u5230\u4F4D\uFF0C\u5206\u7C7B\u6B63\u786E",
      photos: [],
      reviewedAt: new Date(now.getTime() + 4 * 60 * 60 * 1e3)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: now, note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 30 * 60 * 1e3), note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 2 * 60 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210" },
      { status: TaskStatus.CLOSED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() + 4 * 60 * 60 * 1e3), note: "\u590D\u67E5\u901A\u8FC7\uFF0C\u4EFB\u52A1\u5173\u95ED" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.BIN_FULL,
    pointId: point1._id,
    pointName: point1.name,
    community: point1.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u5176\u4ED6\u5783\u573E\u6876\u5DF2\u6EE1\uFF0C\u5783\u573E\u6EA2\u51FA\u5230\u5730\u9762",
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 1 * 60 * 60 * 1e3), caption: samplePhotos[1].caption }
    ],
    afterPhotos: [
      { url: samplePhotos[3].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() + 30 * 60 * 1e3), caption: samplePhotos[3].caption }
    ],
    status: TaskStatus.PENDING_REVIEW,
    propertyCompany: point1.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 30 * 60 * 1e3), note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 30 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.POINT_DAMAGED,
    pointId: point2._id,
    pointName: point2.name,
    community: point2.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u5783\u573E\u6876\u67DC\u95E8\u635F\u574F\uFF0C\u65E0\u6CD5\u6B63\u5E38\u5173\u95ED",
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3), caption: "\u67DC\u95E8\u635F\u574F\u7167\u7247" }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() - 1 * 60 * 60 * 1e3), caption: "\u4E34\u65F6\u4FEE\u590D\u7167\u7247" }
    ],
    status: TaskStatus.REJECTED,
    propertyCompany: point2.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    rejectReason: "\u53EA\u662F\u7528\u94C1\u4E1D\u4E34\u65F6\u56FA\u5B9A\uFF0C\u9700\u8981\u66F4\u6362\u65B0\u7684\u67DC\u95E8",
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: "fail",
      reason: "\u53EA\u662F\u7528\u94C1\u4E1D\u4E34\u65F6\u56FA\u5B9A\uFF0C\u9700\u8981\u66F4\u6362\u65B0\u7684\u67DC\u95E8",
      photos: [
        { url: samplePhotos[1].url, uploadedBy: admin._id, uploadedAt: new Date(now.getTime() - 30 * 60 * 1e3), caption: "\u590D\u67E5\u7167\u7247" }
      ],
      reviewedAt: new Date(now.getTime() - 30 * 60 * 1e3)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1e3), note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210" },
      { status: TaskStatus.REJECTED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 30 * 60 * 1e3), note: "\u590D\u67E5\u4E0D\u901A\u8FC7\uFF1A\u53EA\u662F\u7528\u94C1\u4E1D\u4E34\u65F6\u56FA\u5B9A\uFF0C\u9700\u8981\u66F4\u6362\u65B0\u7684\u67DC\u95E8" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point3._id,
    pointName: point3.name,
    community: point3.community,
    submitterId: gridMember2._id,
    submitterName: gridMember2.name,
    description: "\u53EF\u56DE\u6536\u7269\u6876\u4E2D\u6709\u9910\u53A8\u5783\u573E\uFF0C\u9700\u8981\u52A0\u5F3A\u5BA3\u4F20",
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember2._id, uploadedAt: new Date(now.getTime() - 30 * 60 * 1e3), caption: "\u8BEF\u6295\u7167\u7247" }
    ],
    afterPhotos: [],
    status: TaskStatus.SUBMITTED,
    propertyCompany: point3.propertyCompany,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember2._id, changedByName: gridMember2.name, changedAt: new Date(now.getTime() - 30 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.BIN_FULL,
    pointId: point4._id,
    pointName: point4.name,
    community: point4.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u6240\u6709\u5783\u573E\u6876\u5747\u5DF2\u6EE1\uFF0C\u957F\u65F6\u95F4\u672A\u6E05\u8FD0",
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 26 * 60 * 60 * 1e3), caption: "\u5783\u573E\u6876\u6EE1\u6EA2\u7167\u7247" }
    ],
    afterPhotos: [],
    status: TaskStatus.ESCALATED,
    propertyCompany: point4.propertyCompany,
    deadline: new Date(now.getTime() - 2 * 60 * 60 * 1e3),
    isEscalated: true,
    escalationReason: "\u903E\u671F\u672A\u5904\u7406",
    escalationTime: new Date(now.getTime() - 2 * 60 * 60 * 1e3),
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 26 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.ESCALATED, changedBy: gridMember._id, changedByName: "\u7CFB\u7EDF", changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3), note: "\u7CFB\u7EDF\u81EA\u52A8\u5347\u7EA7\uFF1A\u4EFB\u52A1\u903E\u671F\u672A\u5904\u7406" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point2._id,
    pointName: point2.name,
    community: point2.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u53D1\u73B0\u6709\u5BB3\u5783\u573E\u548C\u5176\u4ED6\u5783\u573E\u6DF7\u6295",
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 3 * 60 * 60 * 1e3), caption: "\u6DF7\u6295\u7167\u7247" }
    ],
    afterPhotos: [],
    status: TaskStatus.CANCELLED,
    propertyCompany: point2.propertyCompany,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CANCELLED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u64A4\u56DE\uFF1A\u5C45\u6C11\u5DF2\u81EA\u884C\u6574\u6539" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.POINT_DAMAGED,
    pointId: point3._id,
    pointName: point3.name,
    community: point3.community,
    submitterId: gridMember2._id,
    submitterName: gridMember2.name,
    description: "\u5206\u7C7B\u6807\u8BC6\u724C\u8131\u843D\uFF0C\u9700\u8981\u91CD\u65B0\u5B89\u88C5",
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember2._id, uploadedAt: new Date(now.getTime() - 5 * 60 * 60 * 1e3), caption: "\u6807\u8BC6\u724C\u8131\u843D" }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property2._id, uploadedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3), caption: "\u7B2C\u4E00\u6B21\u6574\u6539" }
    ],
    status: TaskStatus.CLAIMED,
    propertyCompany: point3.propertyCompany,
    assigneeId: property2._id,
    assigneeName: property2.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1e3),
    isEscalated: false,
    rejectReason: "\u6807\u8BC6\u724C\u5B89\u88C5\u4E0D\u7262\u56FA",
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: "fail",
      reason: "\u6807\u8BC6\u724C\u5B89\u88C5\u4E0D\u7262\u56FA\uFF0C\u6709\u8131\u843D\u98CE\u9669",
      photos: [],
      reviewedAt: new Date(now.getTime() - 3 * 60 * 60 * 1e3)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember2._id, changedByName: gridMember2.name, changedAt: new Date(now.getTime() - 5 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 4.5 * 60 * 60 * 1e3), note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210" },
      { status: TaskStatus.REJECTED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1e3), note: "\u590D\u67E5\u4E0D\u901A\u8FC7\uFF1A\u6807\u8BC6\u724C\u5B89\u88C5\u4E0D\u7262\u56FA" },
      { status: TaskStatus.CLAIMED, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1e3), note: "\u91CD\u65B0\u8BA4\u9886\uFF0C\u7EE7\u7EED\u6574\u6539" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.BIN_FULL,
    pointId: point5._id,
    pointName: point5.name,
    community: point5.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u5783\u573E\u6876\u6EE1\u6EA2\uFF0C\u6E05\u8FD0\u4E0D\u53CA\u65F6",
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 8 * 60 * 60 * 1e3), caption: "\u6EE1\u6EA2\u7167\u7247" }
    ],
    afterPhotos: [
      { url: samplePhotos[1].url, uploadedBy: property3._id, uploadedAt: new Date(now.getTime() - 7 * 60 * 60 * 1e3), caption: "\u7B2C\u4E00\u6B21\u6E05\u8FD0" },
      { url: samplePhotos[2].url, uploadedBy: property3._id, uploadedAt: new Date(now.getTime() - 5 * 60 * 60 * 1e3), caption: "\u7B2C\u4E8C\u6B21\u6E05\u8FD0\uFF08\u590D\u67E5\u4E0D\u901A\u8FC7\u540E\u91CD\u65B0\u6574\u6539\uFF09" }
    ],
    status: TaskStatus.CLOSED,
    propertyCompany: point5.propertyCompany,
    assigneeId: property3._id,
    assigneeName: property3.name,
    deadline: new Date(now.getTime() - 1 * 60 * 60 * 1e3),
    isEscalated: false,
    rejectReason: "\u6E05\u8FD0\u4E0D\u5F7B\u5E95\uFF0C\u6876\u5E95\u6709\u6B8B\u7559\u5783\u573E",
    reviewRecords: [
      {
        reviewerId: admin._id,
        reviewerName: admin.name,
        result: "fail",
        reason: "\u6E05\u8FD0\u4E0D\u5F7B\u5E95\uFF0C\u6876\u5E95\u6709\u6B8B\u7559\u5783\u573E",
        photos: [
          { url: samplePhotos[1].url, uploadedBy: admin._id, uploadedAt: new Date(now.getTime() - 6.5 * 60 * 60 * 1e3), caption: "\u590D\u67E5\u7167\u7247\uFF1A\u6876\u5E95\u6B8B\u7559" }
        ],
        reviewedAt: new Date(now.getTime() - 6.5 * 60 * 60 * 1e3)
      },
      {
        reviewerId: admin._id,
        reviewerName: admin.name,
        result: "pass",
        reason: "\u6574\u6539\u5408\u683C\uFF0C\u6E05\u8FD0\u5F7B\u5E95",
        photos: [
          { url: samplePhotos[0].url, uploadedBy: admin._id, uploadedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3), caption: "\u590D\u67E5\u7167\u7247\uFF1A\u5DF2\u6E05\u7406\u5E72\u51C0" }
        ],
        reviewedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3)
      }
    ],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 8 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property3._id, changedByName: property3.name, changedAt: new Date(now.getTime() - 7.5 * 60 * 60 * 1e3), note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property3._id, changedByName: property3.name, changedAt: new Date(now.getTime() - 7 * 60 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210\uFF1A\u5DF2\u6E05\u8FD0" },
      { status: TaskStatus.REJECTED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 6.5 * 60 * 60 * 1e3), note: "\u590D\u67E5\u4E0D\u901A\u8FC7\uFF1A\u6E05\u8FD0\u4E0D\u5F7B\u5E95\uFF0C\u6876\u5E95\u6709\u6B8B\u7559\u5783\u573E" },
      { status: TaskStatus.CLAIMED, changedBy: property3._id, changedByName: property3.name, changedAt: new Date(now.getTime() - 6 * 60 * 60 * 1e3), note: "\u91CD\u65B0\u8BA4\u9886" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property3._id, changedByName: property3.name, changedAt: new Date(now.getTime() - 5 * 60 * 60 * 1e3), note: "\u91CD\u65B0\u63D0\u4EA4\u6574\u6539\uFF1A\u5F7B\u5E95\u6E05\u7406\u6876\u5E95" },
      { status: TaskStatus.CLOSED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3), note: "\u590D\u67E5\u901A\u8FC7\uFF0C\u4EFB\u52A1\u5173\u95ED" }
    ]
  });
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point1._id,
    pointName: point1.name,
    community: point1.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: "\u53A8\u4F59\u5783\u573E\u6876\u5185\u6DF7\u5165\u5927\u91CF\u5851\u6599\u5305\u88C5",
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 10 * 60 * 60 * 1e3), caption: "\u8BEF\u6295\u7167\u7247" }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() - 9 * 60 * 60 * 1e3), caption: "\u5206\u62E3\u540E\u7167\u7247" }
    ],
    status: TaskStatus.CLOSED,
    propertyCompany: point1.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() - 2 * 60 * 60 * 1e3),
    isEscalated: false,
    reviewRecords: [
      {
        reviewerId: admin._id,
        reviewerName: admin.name,
        result: "pass",
        reason: "\u5206\u62E3\u5408\u683C\uFF0C\u5DF2\u5BF9\u5C45\u6C11\u8FDB\u884C\u5BA3\u4F20",
        photos: [],
        reviewedAt: new Date(now.getTime() - 8.5 * 60 * 60 * 1e3)
      }
    ],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 10 * 60 * 60 * 1e3), note: "\u4EFB\u52A1\u63D0\u4EA4" },
      { status: TaskStatus.CLAIMED, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 9.8 * 60 * 60 * 1e3), note: "\u5B89\u5C45\u7269\u4E1A\u5C1D\u8BD5\u8BA4\u9886\uFF08\u51B2\u7A81\uFF09" },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 9.5 * 60 * 60 * 1e3), note: "\u7EFF\u6E90\u7269\u4E1A\u6210\u529F\u8BA4\u9886\uFF08\u672C\u70B9\u4F4D\u5F52\u5C5E\u7EFF\u6E90\uFF09" },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 9 * 60 * 60 * 1e3), note: "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210\uFF1A\u5DF2\u5206\u62E3\u5E76\u5BA3\u4F20" },
      { status: TaskStatus.CLOSED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 8.5 * 60 * 60 * 1e3), note: "\u590D\u67E5\u901A\u8FC7\uFF0C\u4EFB\u52A1\u5173\u95ED" }
    ]
  });
  await Task.create(tasks);
  return {
    success: true,
    message: "\u6F14\u793A\u6570\u636E\u521D\u59CB\u5316\u5B8C\u6210",
    data: {
      users: createdUsers.length,
      points: createdPoints.length,
      tasks: tasks.length
    },
    accounts: [
      { username: "admin", password: "123456", role: "\u8857\u9053\u7BA1\u7406\u5458" },
      { username: "grid1", password: "123456", role: "\u7F51\u683C\u5458\uFF08\u9633\u5149\u793E\u533A\uFF09" },
      { username: "grid2", password: "123456", role: "\u7F51\u683C\u5458\uFF08\u548C\u5E73\u793E\u533A\uFF09" },
      { username: "property1", password: "123456", role: "\u7269\u4E1A\uFF08\u7EFF\u6E90\u7269\u4E1A\uFF09" },
      { username: "property2", password: "123456", role: "\u7269\u4E1A\uFF08\u5B89\u5C45\u7269\u4E1A\uFF09" },
      { username: "property3", password: "123456", role: "\u7269\u4E1A\uFF08\u6052\u4FE1\u7269\u4E1A\uFF09" }
    ]
  };
});

export { seed_post as default };
//# sourceMappingURL=seed.post.mjs.map
