# QA Checklist — Second Saturday

## 1. Authentication & Onboarding
- [ ] Sign up with email works
- [ ] Sign in with existing account works
- [ ] Google OAuth sign-in works
- [ ] Apple OAuth sign-in works (if configured)
- [ ] Complete profile page appears for new users
- [ ] Profile name and avatar can be set
- [ ] Redirect to dashboard after profile completion
- [ ] Sign out works correctly

## 2. Dashboard
- [ ] Dashboard loads and displays user's circles
- [ ] Empty state shown when user has no circles
- [ ] Monthly newsletter archive browsing works (date picker)
- [ ] Navigation to circle detail works
- [ ] "Create Circle" button is accessible

## 3. Circle Creation Flow
- [ ] Multi-step creation form works end-to-end
- [ ] Circle name, description fields validate properly
- [ ] Icon and cover image upload works
- [ ] Prompt setup step (select 3-8 prompts)
- [ ] Prompt library browsable by category (Fun, Gratitude, Reflection, Check-in)
- [ ] Custom prompts can be added
- [ ] Setup complete page shows with invite link
- [ ] Invite link is copyable/shareable

## 4. Circle Management (Admin)
- [ ] Circle settings page loads correctly
- [ ] Circle name/description editable
- [ ] Cover/icon image changeable
- [ ] Invite code visible and regeneratable
- [ ] Member list displays correctly
- [ ] Remove member works
- [ ] Transfer admin role works
- [ ] Prompts editor — add/edit/delete/reorder prompts (drag & drop)
- [ ] Max 8 prompts enforced

## 5. Joining a Circle (Member)
- [ ] Invite link opens circle preview
- [ ] Unauthenticated user prompted to sign up/in
- [ ] After auth, user auto-joins the circle
- [ ] New member appears in circle member list
- [ ] Member can leave a circle

## 6. Submissions
- [ ] "Make Submission" flow accessible from dashboard
- [ ] Per-circle submit page works
- [ ] All prompts for the circle are shown
- [ ] Text responses can be entered
- [ ] Media upload works (images)
- [ ] Video upload works (Mux integration)
- [ ] Max 3 media items per prompt enforced
- [ ] Auto-save / draft functionality works
- [ ] Final submit button works
- [ ] Submission locked after deadline (can't edit)
- [ ] Countdown/deadline display is correct

## 7. Submissions Admin View
- [ ] Admin can see member submission status
- [ ] Progress indicators per member are accurate
- [ ] Deadline countdown shown
- [ ] Reminder sending works (if enabled)

## 8. Newsletters
- [ ] Newsletter compiles and displays correctly
- [ ] All member responses shown with text + media
- [ ] Member avatars and names display correctly
- [ ] Newsletter archive — past months browsable
- [ ] Empty state when no newsletter exists for a month
- [ ] Newsletter read tracking works

## 9. Notification Preferences
- [ ] Notification settings page loads
- [ ] Toggle submission reminders on/off
- [ ] Toggle newsletter notifications on/off
- [ ] Settings persist after page reload

## 10. Responsive Design & Mobile
- [ ] All pages render correctly on mobile viewport
- [ ] Desktop split-view works on wider screens
- [ ] Touch interactions work (drag & drop prompts)
- [ ] No horizontal overflow/scroll issues
- [ ] Safe area / notch handling (Capacitor)

## 11. Error Handling & Edge Cases
- [ ] Loading states shown during data fetches
- [ ] Error states shown on API failures
- [ ] Empty states for lists with no data
- [ ] 404 page for invalid routes
- [ ] Auth-protected routes redirect unauthenticated users
- [ ] Deep linking to specific circles/newsletters works

## 12. Performance & Polish
- [ ] Pages load without excessive delay
- [ ] No console errors in browser dev tools
- [ ] Images/media load correctly (no broken images)
- [ ] Dark mode / light mode toggle works
- [ ] Fonts load correctly (Instrument Sans, Instrument Serif, Courier Prime)
- [ ] Animations/transitions are smooth
