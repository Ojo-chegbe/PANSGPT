# How to Add "Did You Know" Facts

## Quick Guide

I've created a comprehensive loading experience for your quiz generation with a multi-stage progress indicator and engaging "Did You Know" facts. Here's how to add more facts:

## File Location
All facts are stored in: `src/lib/did-you-know-facts.ts`

## How to Add Facts

### 1. Basic Format
Each fact follows this exact structure:
```typescript
{ id: 'unique_id', category: 'Category Name', fact: 'Your interesting fact here', emoji: '🎯' }
```

### 2. Step-by-Step Process

1. **Open the file**: `src/lib/did-you-know-facts.ts`
2. **Find the array**: Look for `DID_YOU_KNOW_FACTS: DidYouKnowFact[] = [`
3. **Add your fact**: Insert a new fact object following the format above
4. **Use the next ID**: Continue from the last number (currently 100)

### 3. Example of Adding a New Fact
```typescript
// Add this line inside the array (before the closing bracket)
{ id: '101', category: 'Medicine', fact: 'The human body has enough iron to make a 3-inch nail', emoji: '🔩' },
```

### 4. Available Categories
You can use existing categories or create new ones:
- **Science** - Physics, chemistry, biology facts
- **Technology** - Computers, internet, AI facts  
- **History** - Historical events, people, cultures
- **Space** - Astronomy, planets, stars
- **Biology** - Human body, animals, nature
- **Psychology** - Learning, memory, behavior
- **Geography** - Countries, landmarks, Earth
- **Food** - Nutrition, cooking, agriculture
- **Animals** - Wildlife, pets, marine life
- **Math** - Numbers, equations, statistics

### 5. Tips for Great Facts
- ✅ Make them surprising or counterintuitive
- ✅ Use specific numbers when possible
- ✅ Keep them educational and accurate
- ✅ Make them engaging and fun
- ✅ Choose appropriate emojis
- ✅ Keep facts family-friendly

### 6. Examples of Good Facts
```typescript
{ id: '101', category: 'Science', fact: 'A group of flamingos is called a "flamboyance"', emoji: '🦩' },
{ id: '102', category: 'Technology', fact: 'The first computer bug was an actual bug - a moth!', emoji: '🐛' },
{ id: '103', category: 'Biology', fact: 'Your stomach gets a new lining every 3-5 days', emoji: '🫀' },
```

### 7. Adding Many Facts at Once
To reach 1000+ facts, you can:
- Add them manually (10-20 at a time)
- Use AI to generate educational facts
- Import from fact databases
- Create a script to generate facts
- Ask users to submit facts

### 8. Testing Your Facts
After adding facts:
1. Save the file
2. Start the development server: `npm run dev`
3. Go to the quiz page and create a quiz
4. Watch the loading modal to see your new facts!

## Current Status
- ✅ 100 facts already included
- ✅ 6 realistic progress stages
- ✅ Smooth animations and transitions
- ✅ Fact shuffling system
- ✅ Category display
- ✅ Progress indicators

## Next Steps
1. Add 10-20 facts per day
2. Focus on your target audience (students)
3. Include facts related to your courses
4. Monitor which facts users find most engaging
5. Consider user-submitted facts

The loading experience will keep users engaged while the AI generates their personalized quiz!
