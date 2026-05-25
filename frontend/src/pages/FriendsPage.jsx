// src/pages/FriendsPage.jsx

import PageTitle from "../components/PageTitle";
import FriendCard from "../components/FriendCard";
import friends from "../data/friends";

function FriendsPage() {
  return (
    <section className="page-section">
      <div className="content-width">
        <PageTitle title="Friends" /> 
        
        <div className="friends-grid">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FriendsPage;

/* 调用到了components中的两个组件，大写开头的
1. 先用PageTitle 渲染出了“Friends”那个大写标题
2. 再遍历渲染了朋友卡片，friends数据是js形式，看个大概懂*/