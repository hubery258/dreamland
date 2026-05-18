// src/components/FriendCard.jsx

/**
 * 单个友链卡片
 */
function FriendCard({ friend }) {
  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noreferrer"
      className="friend-card"
    >
      <div className="friend-avatar-wrap">
        {friend.avatar ? (
          <img
            src={friend.avatar}
            alt={friend.name}
            className="friend-avatar"
          />
        ) : (
          <div className="friend-avatar friend-avatar-placeholder">
            <span>IMG</span>
          </div>
        )}
      </div>

      <div className="friend-info">
        <h3 className="friend-name">{friend.name}</h3>
        <p className="friend-description">{friend.description}</p>
      </div>
    </a>
  );
}

export default FriendCard;