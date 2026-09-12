from sqlalchemy.orm import Session

from . import models, schemas


def _required_text(value: str, field_name: str):
    result = value.strip()
    if not result:
        raise ValueError(f"{field_name}不能为空")
    return result


def _web_url(value: str, field_name: str, required: bool = True):
    result = value.strip()
    if not result and not required:
        return ""
    if not result.startswith(("http://", "https://")):
        raise ValueError(f"{field_name}必须以 http:// 或 https:// 开头")
    return result


def get_friends(db: Session):
    return db.query(models.FriendLink).order_by(
        models.FriendLink.sort_order.asc(),
        models.FriendLink.id.asc(),
    ).all()


def get_friend(db: Session, friend_id: int):
    return db.query(models.FriendLink).filter(models.FriendLink.id == friend_id).first()


def create_friend(db: Session, data: schemas.FriendLinkCreate):
    friend = models.FriendLink(
        name=_required_text(data.name, "友链名称"),
        description=data.description.strip(),
        url=_web_url(data.url, "站点 URL"),
        avatar=_web_url(data.avatar, "头像 URL", required=False),
        sort_order=data.sort_order,
    )
    db.add(friend)
    db.commit()
    db.refresh(friend)
    return friend


def update_friend(db: Session, friend: models.FriendLink, data: schemas.FriendLinkUpdate):
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        friend.name = _required_text(updates["name"], "友链名称")
    if "description" in updates and updates["description"] is not None:
        friend.description = updates["description"].strip()
    if "url" in updates and updates["url"] is not None:
        friend.url = _web_url(updates["url"], "站点 URL")
    if "avatar" in updates and updates["avatar"] is not None:
        friend.avatar = _web_url(updates["avatar"], "头像 URL", required=False)
    if "sort_order" in updates and updates["sort_order"] is not None:
        friend.sort_order = updates["sort_order"]
    db.commit()
    db.refresh(friend)
    return friend


def delete_friend(db: Session, friend: models.FriendLink):
    db.delete(friend)
    db.commit()


def seed_friends(db: Session):
    """首次升级时把原有的前端静态友链迁移进数据库。"""
    if db.query(models.FriendLink).first():
        return

    initial_friends = [
        models.FriendLink(
            name="Chenのhomepage",
            description="yzgg tql",
            url="https://Bamb0oChen.github.io/",
            avatar="https://s41.ax1x.com/2026/03/14/peEcPHK.png",
            sort_order=10,
        ),
        models.FriendLink(
            name="小板砖",
            description="深圳最帅之人",
            url="https://littlebanbrick.cn",
            avatar="https://avatars.githubusercontent.com/u/245135180?v=4",
            sort_order=20,
        ),
        models.FriendLink(
            name="FelixFu's Craft",
            description="jfgg做出来功能很全面的的小站:关于cs、随笔、音乐与学习等等!",
            url="https://www.felixfu.xyz",
            avatar="https://www.felixfu.xyz/uploads/20260809094541-13e0eedf9b354f93b34bd16818147e9e.jpg",
            sort_order=30,
        ),
    ]
    db.add_all(initial_friends)
    db.commit()
