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