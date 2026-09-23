// src/components/ProfileCard.jsx

import {
  FaGithub,
  FaZhihu,
  FaRss,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { SiDouban, SiWechat,SiBilibili } from "react-icons/si";

import profile from "../data/profile";

/**
 * 左侧个人卡片组件
 * 用在首页左栏
 */
function ProfileCard({ postCount = 0, tagCount = 0 }) {
  const { name, bioLines, avatarUrl, links } = profile;

  return (
    <aside className="profile-card">
      <div className="profile-avatar-wrap">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="profile-avatar" />
        ) : (
          <div className="profile-avatar profile-avatar-placeholder">
            <span>Avatar</span>
          </div>
        )}
      </div>

      <h2 className="profile-name">{name}</h2>

      <div className="profile-bio">
        {bioLines.map((line, index) => (
          <p key={index} className="profile-bio-line">
            {line}
          </p>
        ))}
      </div>

      <div className="profile-stats">
        <div className="profile-stat-item">
          <span className="profile-stat-label">文章</span>
          <span className="profile-stat-value">{postCount}</span>
        </div>

        <div className="profile-stat-item">
          <span className="profile-stat-label">标签</span>
          <span className="profile-stat-value">{tagCount}</span>
        </div>
      </div>

      <div className="profile-socials">
        <a href={links.github} target="_blank" rel="noreferrer" className="social-icon-link" title="GitHub">
          <FaGithub />
        </a>

        <a href={links.email} target="_blank" rel="noreferrer" className="social-icon-link" title="Email">
          <MdEmail />
        </a>

        <a href={links.notebook} target="_blank" rel="noreferrer" className="social-icon-link" title="Notebook">
          <HiOutlineBookOpen />
        </a>

        <a href={links.zhihu} target="_blank" rel="noreferrer" className="social-icon-link" title="Zhihu">
          <FaZhihu />
        </a>

        <a href={links.douban} target="_blank" rel="noreferrer" className="social-icon-link" title="Douban">
          <SiDouban />
        </a>

        <a href={links.bilibili} target="_blank" rel="noreferrer" className="social-icon-link" title="Bilibili">
          <SiBilibili />
        </a>

        <a href={links.wechat} target="_blank" rel="noreferrer" className="social-icon-link" title="微信公众号">
          <SiWechat />
        </a>

        <a href="/rss.xml" className="social-icon-link" title="订阅 RSS" aria-label="订阅 RSS">
          <FaRss />
        </a>
      </div>
    </aside>
  );
}

export default ProfileCard;
