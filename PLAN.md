# Fix infinite loop in onboarding screen

**Problem:** The onboarding screen crashes with "Maximum update depth exceeded" because syncing the current step to the store triggers a re-render, which triggers the sync again, creating an endless loop.

**Fix:**
- Remove `store` from the dependency array of the step-syncing effect, so it only runs when `step` actually changes
- Extract the `setCurrentStep` function once outside the effect to avoid referencing the whole store object
- This is a small, targeted bug fix with no visual or behavioral changes