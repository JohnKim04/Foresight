# Foresight Product Ideas and Features

Initial concept, market context, feature ideas, and product direction.

This working document preserves the original product idea alongside two exploratory analyses. It is the home for product concepts and feature ideas, not implementation decisions. See [implementation.md](implementation.md) for the current approach to input parsing and data handling.

## Original Concept

This is an idea I have. Does something like this exist? An everything tracker or log.

With the addition of diary and feeling aspect.

For example, it tracks literally everything. Potentially with voice logging to make it easier.

Like: I went out this night and drank a little too much. In the moment I wanted to drink, but the next day half my day suffered and I felt like death in the morning. There could be a quantifiable way to track it, on a scale from made me feel really bad, neutral, to made me feel really good.

Or: I bought this thing, or I went out to eat, and how did that make me feel after the fact? I was really tired and didn't want to work out, but I did anyway. I felt better after. How did that make me feel?

Overall, it helps create better and healthier habits.

The final version proactively prompts you. On a Friday night, it notifies you: Are you going out tonight? Yes or no. You can say what times you expect to go out, and during that time the app will ping you: Do you think you should be slowing down on the drinks? That is one specific example.

Another example is downloading social media. I try to keep it deleted, but sometimes I have it downloaded and have scrolling sessions where I feel bad afterward.

## Initial AI Market Perspective

No single app currently integrates all of these layers into one unified product, though several existing tools tackle isolated pieces of the idea.

### Activity and Mood Correlation Trackers

- Daylio uses micro-entries and custom icons to link daily activities, such as drinking or working out, with mood scores. It generates correlation charts over time, but relies on rigid manual tapping rather than fluid voice input and lacks proactive real-time nudging.
- Bearable tracks habits, symptoms, energy, and mood to identify cause-and-effect patterns, such as how late-night screen time affects next-day energy. It is thorough for correlation tracking, but can be high-friction to enter.
- Exist.io aggregates data from wearables, screen time, and calendars, then asks for a daily mood check to calculate correlations across lifestyle factors.

### Natural Language AI Journals

- Rosebud and AudioPen show how unstructured voice logging can be turned into themes, sentiment, and emotional trends with language models.
- The relevant interaction for this concept is broader: someone should be able to type or speak naturally, with the system parsing either form into structured data. The limitation of many AI journals is that they act primarily as reflective diaries rather than behavioral accountability systems that map specific actions to delayed physical and emotional outcomes.

### Contextual Nudges and Real Time Friction

- Sunnyside and Reframe focus on alcohol moderation, using proactive SMS and push notifications to check in during nights out.
- One Sec and Opal create friction around social-media app launches with pauses or prompts, but act on screen-time triggers rather than a wider life context.

### Product Gap Proposed

- **Delayed sentiment mapping:** Track an action at the time it happens and deliberately prompt for the physical or mental impact later, measuring satisfaction, regret, or energy after the consequence is known.
- **Unstructured language to metrics:** Let someone type or speak naturally, then have AI propose structured records for activity, context, and sentiment.
- **Domain agnostic proactive intervention:** Go beyond a single behavior and use a person's own history to intervene before a repeated pattern occurs.

## Current Product Perspective

The strongest part of the concept is not generic mood and habit tracking. It is the feedback loop: **action, delayed consequence, personal evidence, and a timely choice** the next time a similar situation arises.

Foresight is best framed as a **natural-language consequence journal**. People log in the mode that feels easiest - free-form typing or voice - while the app extracts habits, events, context, mood, and feelings into usable data. Its purpose is to reveal the patterns between what someone does and how it affects them later.

The product could move beyond a generic habit tracker by making the consequence personal and concrete. For example: “The last four times you drank past midnight, you rated the following morning 2 out of 10. Do you want to set a two-drink check-in tonight?”

The market is adjacent rather than empty. Daylio combines mood, activities, reminders, statistics, notes, and voice memos. Bearable supports detailed factor and symptom tracking with correlations. Exist combines manual data with data from calendars and wearables. AI journals such as Aksha offer voice journaling, emotional analysis, and personalized prompts. Focused products offer alcohol moderation or social-media friction. The opportunity is a single private experience that joins effortless capture, delayed outcome tracking, cross-domain learning, and consent-based real-time interventions.

The biggest risk is trying to track literally everything. High effort causes people to stop logging, and too much noisy data produces shallow insights. The product should feel like a diary first and a tracker second.

### Suggested Product Loop

1. **Capture:** Type or dictate a natural note, such as “Went out, had four drinks, fun night but exhausted.”
2. **Clarify:** The app proposes an event, activity, time, and tags, while the person can edit or reject them.
3. **Follow up:** At a sensible delay, ask one short question, such as “How did last night affect your morning?”, with a simple scale and optional voice response.
4. **Reflect:** Show careful evidence over time, such as “Late social drinking is associated with lower next-morning energy in 7 of 9 logged cases.” Avoid claiming causation.
5. **Intervene:** Only after enough personal evidence and only with opt-in permission, offer a relevant prompt or self-selected safeguard.

### Recommended Starting Point

Start as a **natural-language consequence journal for choices a person feels ambivalent about**. Let people use free-form typing or voice, whichever suits the moment. Instead of asking someone to track every part of life, ask them to choose two or three areas to begin with, such as alcohol, workouts, late-night scrolling, spending, caffeine, sleep, or social plans.

A first version could center on three screens: **Log**, **Check In**, and **Patterns**. The early proof is whether people repeatedly log in their preferred format and voluntarily answer follow-up questions. Trust is central: data should be private by default, AI-extracted records should be editable, every nudge should explain why it appeared, and users should control what the app remembers and what it may prompt about.

## Examples Referenced

- [Daylio](https://daylio.net/)
- [Bearable](https://bearable.app/)
- [Exist](https://exist.io/)
- [Aksha](https://aksha.ai/)
