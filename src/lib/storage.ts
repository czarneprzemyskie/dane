export type User = {
  id: string;
  username: string;
  password: string; // simple hash for demo
};

export type Plate = {
  id: string;
  registration: string;
  owner?: string | null; // optional owner username
  notes?: string;
  createdAt: string;
};

export type Post = {
  id: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
};

const USERS_KEY = 'czp_users';
const PLATES_KEY = 'czp_plates';
const POSTS_KEY = 'czp_posts';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    return null;
  }
}

function write<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getUsers(): User[] {
  return read<User[]>(USERS_KEY) ?? [];
}

export function saveUsers(users: User[]) {
  write(USERS_KEY, users);
}

export function addUser(u: User) {
  const users = getUsers();
  users.push(u);
  saveUsers(users);
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username);
}

export function getPlates(): Plate[] {
  return read<Plate[]>(PLATES_KEY) ?? [];
}

export function savePlates(list: Plate[]) {
  write(PLATES_KEY, list);
}

export function addPlate(p: Plate) {
  const list = getPlates();
  list.unshift(p);
  savePlates(list);
}

export function searchPlates(q: string): Plate[] {
  const s = q.trim().toLowerCase();
  if (!s) return getPlates();
  return getPlates().filter((p) => p.registration.toLowerCase().includes(s) || (p.notes || '').toLowerCase().includes(s));
}

export function getPosts(): Post[] {
  return read<Post[]>(POSTS_KEY) ?? [];
}

export function savePosts(posts: Post[]) {
  write(POSTS_KEY, posts);
}

export function addPost(post: Post) {
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
}
