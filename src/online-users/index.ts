import { NextEditorUser } from '@nexteditorjs/nexteditor-sharedb/dist/messages';

class OnlineUsers {
  private users = new Map<string, Map<string, NextEditorUser> >();

  addUser(presenceChannel: string, user: NextEditorUser) {
    const users = this.users.get(presenceChannel);
    if (users) {
      users.set(user.clientId, user);
    } else {
      const newUsers = new Map<string, NextEditorUser>();
      newUsers.set(user.clientId, user);
      this.users.set(presenceChannel, newUsers);
    }
  }

  removeUser(presenceChannel: string, clientId: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return;
    users.delete(clientId);
  }

  getOnlineUsers(presenceChannel: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return [];
    return Array.from(users.values());
  }
}

const onlineUsers = new OnlineUsers();

export default onlineUsers;
