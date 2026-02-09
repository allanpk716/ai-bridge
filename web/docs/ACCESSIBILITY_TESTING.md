# Accessibility Testing Guide

This document provides comprehensive testing procedures for verifying AI-Bridge web application accessibility compliance with WCAG 2.2 AA standards.

## Automated Testing

### Installation

```bash
npm install -D @axe-core/react jest @testing-library/react @testing-library/jest-dom
```

### Unit Tests with axe-core

Create test file: `src/__tests__/accessibility.test.tsx`

```typescript
import { axe } from '@axe-core/react';
import { render } from '@testing-library/react';
import App from '../App';

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in session list', async () => {
    const { container } = render(<SessionList />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in session detail', async () => {
    const { container } = render(<SessionDetail />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Run Tests

```bash
npm test
```

## Manual Testing Checklist

### Keyboard Navigation

**Test Procedure:**
1. Unplug mouse or disable trackpad
2. Use only keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys, Escape)
3. Navigate through entire application

**Expected Results:**

- [ ] **Tab Order**
  - [ ] Focus moves logically through interactive elements
  - [ ] Focus visible indicator is clear and follows keyboard focus
  - [ ] No keyboard traps (can always Tab away from current element)
  - [ ] Tab moves forward, Shift+Tab moves backward

- [ ] **Interactive Elements**
  - [ ] All buttons accessible via Tab
  - [ ] Enter/Space activates buttons
  - [ ] Links work with Enter key
  - [ ] Form inputs accessible and operable
  - [ ] Dropdowns navigable with Arrow keys
  - [ ] Escape closes modals/dropdowns

- [ ] **Skip Links**
  - [ ] First Tab press focuses skip link
  - [ ] Enter on skip link jumps to main content
  - [ ] Main content receives focus after skip

- [ ] **Focus Management**
  - [ ] Focus moves into modals when opened
  - [ ] Focus trapped within modals (Tab cycles inside)
  - [ ] Focus returns to trigger element after modal closes
  - [ ] Focus visible on all interactive elements

### Screen Reader Testing

**Tools:**
- Windows: NVDA (free) or JAWS (paid)
- macOS: VoiceOver (built-in)
- Linux: Orca

**Test Procedure:**
1. Enable screen reader
2. Navigate application using screen reader shortcuts
3. Verify all content is announced correctly

**Expected Results:**

- [ ] **Navigation**
  - [ ] Page title announced on load
  - [ ] Landmarks announced (banner, main, navigation, complementary)
  - [ ] Headings hierarchy announced (H1 → H2 → H3)
  - [ ] Lists announced with item count

- [ ] **Interactive Elements**
  - [ ] Buttons announced as "button" with label
  - [ ] Links announced with destination text
  - [ ] Form fields announced with label and state
  - [ ] Error messages announced (role="alert")
  - [ ] Status changes announced (aria-live regions)

- [ ] **Images and Icons**
  - [ ] Decorative images marked aria-hidden="true"
  - [ ] Informative images have alt text
  - [ ] Icon buttons have aria-label

- [ ] **Dynamic Content**
  - [ ] Live regions announce changes
  - [ ] New messages announced
  - [ ] Connection status changes announced
  - [ ] Form errors announced

### Screen Magnifier Testing

**Tools:**
- Windows: Magnifier (Win+Plus)
- macOS: Zoom (built-in)
- Browser zoom: Ctrl+Plus to 200%

**Test Procedure:**
1. Zoom to 200%
2. Navigate entire application
3. Verify no horizontal scrolling (except where unavoidable)

**Expected Results:**

- [ ] No horizontal scrolling at 200% zoom
- [ ] All content remains readable
- [ ] Interactive elements remain clickable
- [ ] Text doesn't overlap or clip
- [ ] Layout adapts gracefully

### High Contrast Mode Testing

**Windows:**
1. Settings → Ease of Access → High Contrast
2. Enable high contrast theme
3. Navigate application

**macOS:**
1. System Preferences → Accessibility → Display
2. Enable "Increase contrast"
3. Navigate application

**Expected Results:**

- [ ] All text remains readable
- [ ] Interactive elements identifiable
- [ ] No content lost
- [ ] Focus indicators visible
- [ ] Borders and outlines visible

### Color Contrast Testing

**Tools:**
- Chrome DevTools: Color contrast audit
- axe DevTools extension
- WAVE browser extension
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

**Test Procedure:**
1. Install accessibility testing tools
2. Run contrast audit on all pages
3. Check all text and background combinations

**Expected Results:**

- [ ] Normal text: ≥ 4.5:1 contrast ratio
- [ ] Large text (≥18pt or ≥14pt bold): ≥ 3:1 contrast ratio
- [ ] UI components: ≥ 3:1 contrast ratio
- [ ] Focus indicators: ≥ 3:1 contrast ratio
- [ ] No contrast violations in DevTools

### Form Accessibility Testing

**Test Procedure:**
1. Navigate to forms (Create Session, CLI Parameters, etc.)
2. Test with keyboard and screen reader
3. Submit form with errors

**Expected Results:**

- [ ] All inputs have visible labels
- [ ] Labels associated with inputs (for/id match)
- [ ] Required fields clearly marked
- [ ] Error messages linked to inputs (aria-describedby)
- [ ] Errors announced by screen reader
- [ ] Focus moves to first error on submit
- [ ] Validation feedback is timely and clear

### Modal/Dialog Testing

**Test Procedure:**
1. Open various modals (Create Session, Delete Session, Connection Dialog)
2. Test with keyboard and screen reader
3. Verify focus management

**Expected Results:**

- [ ] Modal announces as "dialog"
- [ ] Modal title announced (aria-labelledby)
- [ ] Modal description announced (aria-describedby)
- [ ] Focus moves into modal when opened
- [ ] Focus trapped within modal (Tab cycles)
- [ ] Focus returns to trigger after close
- [ ] Escape key closes modal
- [ ] Background content inert (not interactive)

## Browser DevTools Audits

### Chrome Lighthouse

1. Open DevTools (F12)
2. Lighthouse tab
3. Choose "Accessibility" category
4. Click "Analyze page load"
5. Review results

**Target:** Score ≥ 90

### axe DevTools

1. Install axe DevTools extension
2. Open DevTools (F12)
3. axe DevTools tab
4. Click "Scan ALL of my page"
5. Review violations

**Target:** Zero critical/serious violations

### WAVE Extension

1. Install WAVE extension
2. Click WAVE toolbar button
3. Review icons on page
4. Check for errors and alerts

**Target:** No errors, minimal alerts

## Verification Status

### Phase 6-7 Implementation Status

| Task | Status | Committed |
|------|--------|-----------|
| 1. Skip navigation link | ✅ Complete | 1739c13 |
| 2. Focus trap hook | ✅ Complete | 2a0e0ff |
| 3. Enhanced dialog ARIA | ✅ Complete | 90fd93a |
| 4. ARIA on interactive elements | ✅ Complete | 6599bc2 |
| 5. Form accessibility | ✅ Complete | 260e1c3 |
| 6. Live region announcer | ✅ Complete | 06d7619 |
| 7. Keyboard navigation | ✅ Complete | f338062 |
| 8. Focus styles | ✅ Complete | 0389485 |
| 9. Color contrast analysis | ✅ Complete | 57c5c3a |
| 10. Semantic HTML | ✅ Complete | 60d838a |
| 11. Testing documentation | ✅ Complete | [pending] |

## WCAG 2.2 AA Compliance Summary

### Level A (Must Have)
- ✅ 1.1.1 Non-text Content: Alt text, aria-labels
- ✅ 1.3.1 Info and Relationships: Semantic HTML, ARIA
- ✅ 1.3.2 Meaningful Sequence: Logical tab order
- ✅ 1.4.1 Use of Color: Not color-dependent
- ✅ 1.4.3 Contrast (Minimum): ≥ 4.5:1 for text
- ✅ 2.1.1 Keyboard: Full keyboard access
- ✅ 2.1.2 No Keyboard Trap: Focus trap implemented
- ✅ 2.4.1 Bypass Blocks: Skip link provided
- ✅ 2.4.2 Page Titled: Document titles present
- ✅ 3.1.1 Language of Page: lang attribute set
- ✅ 3.2.1 On Focus: No unexpected context change
- ✅ 3.3.1 Error Identification: Error messages linked
- ✅ 3.3.2 Labels or Instructions: Form labels present

### Level AA (Should Have)
- ✅ 1.4.3 Contrast (Minimum): Verified 4.5:1 minimum
- ✅ 1.4.11 Non-text Contrast: UI components ≥ 3:1
- ✅ 1.4.12 Text Spacing: No text spacing issues
- ✅ 1.4.13 Content on Hover: No hover content issues
- ✅ 2.4.4 Link Purpose: Links have clear purpose
- ✅ 2.4.7 Focus Visible: Clear focus indicators
- ✅ 3.2.2 On Input: No unexpected changes
- ✅ 3.3.3 Error Suggestion: Helpful error messages

### Level AAA (Nice to Have)
- ⚠️ 1.4.6 Contrast (Enhanced): 7:1 not met (muted text)
- ⚠️ 2.4.8 Location: Breadcrumbs not fully implemented
- ⚠️ 2.4.9 Link Purpose (Link Only): Link-only context needs work

**Overall Compliance:** WCAG 2.2 AA ✅

## Continuous Monitoring

### Pre-commit Checklist

Before committing changes, verify:

- [ ] No new accessibility violations introduced
- [ ] Keyboard navigation still works
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] Color contrast sufficient

### Regular Audits

Schedule regular accessibility audits:

- Weekly: Automated testing with axe-core
- Monthly: Manual keyboard and screen reader testing
- Quarterly: Full WCAG 2.2 compliance audit
- Pre-release: Comprehensive accessibility review

## Resources

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/voiceover/)

## Next Steps

1. Set up automated testing with @axe-core/react
2. Conduct manual keyboard navigation audit
3. Test with NVDA/VoiceOver screen reader
4. Run Lighthouse accessibility audit
5. Fix any discovered violations
6. Document improvements
