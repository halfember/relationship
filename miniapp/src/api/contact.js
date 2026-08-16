import { get, post, del } from '@/utils/request.js';

export const contactApi = {
  createInvite(data) { return post('/contact/invites', data); },
  listSentInvites() { return get('/contact/invites/sent'); },
  revokeInvite(id) { return del(`/contact/invites/${id}`); },
  invitePreview(token) { return get(`/contact/invites/${token}`); },
  acceptInvite(data) { return post('/contact/invites/accept', data); },
  rejectInvite(data) { return post('/contact/invites/reject', data); },
  list() { return get('/contact/connections'); },
  detail(id) { return get(`/contact/connections/${id}`); },
  disconnect(id) { return del(`/contact/connections/${id}`); },
};
