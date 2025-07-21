const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  gmailAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'GmailAccount', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  subject: String,
  body: String, // Plain text body
  htmlBody: String, // HTML body for rich content
  from: String,
  to: [String],
  messageId: { type: String, unique: true },
  threadId: String,
  hasAttachments: Boolean,
  unsubscribeLink: String,
  rawHeaders: Object,
  summary: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Email', emailSchema);
