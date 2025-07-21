import React from 'react';

export default function EmailItem({ email, isSelected, onSelect, onClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
  };

  const handleItemClick = () => {
    onClick();
  };

  return (
    <div 
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={handleItemClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded mt-1"
          />
        </div>

        {/* Email Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {email.subject || '(No Subject)'}
                </h3>
                {email.hasAttachments && (
                  <span className="text-blue-600 text-sm">📎</span>
                )}
                {email.unsubscribeLink && (
                  <span className="text-orange-600 text-sm">🔗</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                From: {email.from}
              </p>
              
              {email.summary && (
                <p className="text-sm text-gray-700 mb-2">
                  {truncateText(email.summary, 150)}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatDate(email.createdAt)}</span>
                {email.gmailAccount && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {email.gmailAccount.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 