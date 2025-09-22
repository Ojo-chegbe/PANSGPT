export interface DidYouKnowFact {
  id: string;
  category: string;
  fact: string;
  emoji: string;
}

// Sample facts - you can add more by following this pattern
export const DID_YOU_KNOW_FACTS: DidYouKnowFact[] = [
  // Science & Nature
  { id: '1', category: 'Science', fact: 'A group of flamingos is called a "flamboyance"', emoji: '🦩' },
  { id: '2', category: 'Science', fact: 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still perfectly edible!', emoji: '🍯' },
  { id: '3', category: 'Science', fact: 'Octopuses have three hearts and blue blood', emoji: '🐙' },
  { id: '4', category: 'Science', fact: 'A single cloud can weigh more than a million pounds', emoji: '☁️' },
  { id: '5', category: 'Science', fact: 'Bananas are berries, but strawberries aren\'t', emoji: '🍌' },
  { id: '6', category: 'Science', fact: 'The human brain contains approximately 86 billion neurons', emoji: '🧠' },
  { id: '7', category: 'Science', fact: 'A day on Venus is longer than its year', emoji: '🪐' },
  { id: '8', category: 'Science', fact: 'Sharks have been around longer than trees', emoji: '🦈' },
  { id: '9', category: 'Science', fact: 'The speed of light is about 186,282 miles per second', emoji: '⚡' },
  { id: '10', category: 'Science', fact: 'There are more possible games of chess than atoms in the observable universe', emoji: '♟️' },
  
  // Technology & Innovation
  { id: '11', category: 'Technology', fact: 'The first computer bug was an actual bug - a moth found trapped in a Harvard Mark II computer in 1947', emoji: '🐛' },
  { id: '12', category: 'Technology', fact: 'The first domain name ever registered was symbolics.com on March 15, 1985', emoji: '🌐' },
  { id: '13', category: 'Technology', fact: 'The average person spends about 6 years of their life dreaming', emoji: '💭' },
  { id: '14', category: 'Technology', fact: 'The first email was sent in 1971 by Ray Tomlinson to himself', emoji: '📧' },
  { id: '15', category: 'Technology', fact: 'The original name for Google was "Backrub"', emoji: '🔍' },
  { id: '16', category: 'Technology', fact: 'The first webcam was created to monitor a coffee pot at Cambridge University', emoji: '📹' },
  { id: '17', category: 'Technology', fact: 'The "www" in website addresses is optional and not required', emoji: '🌍' },
  { id: '18', category: 'Technology', fact: 'The first computer mouse was made of wood', emoji: '🖱️' },
  { id: '19', category: 'Technology', fact: 'The first text message was sent in 1992 and said "Merry Christmas"', emoji: '📱' },
  { id: '20', category: 'Technology', fact: 'The first website is still online at info.cern.ch', emoji: '💻' },
  
  // History & Culture
  { id: '21', category: 'History', fact: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid', emoji: '🏺' },
  { id: '22', category: 'History', fact: 'The shortest war in history lasted only 38-45 minutes', emoji: '⚔️' },
  { id: '23', category: 'History', fact: 'Napoleon was actually average height for his time - the "short" myth came from British propaganda', emoji: '👑' },
  { id: '24', category: 'History', fact: 'The Great Wall of China is not visible from space with the naked eye', emoji: '🏯' },
  { id: '25', category: 'History', fact: 'The ancient Romans used to brush their teeth with urine', emoji: '🦷' },
  { id: '26', category: 'History', fact: 'The Library of Alexandria was not destroyed in a single fire - it declined over several centuries', emoji: '📚' },
  { id: '27', category: 'History', fact: 'The first recorded use of the word "hello" as a greeting was in 1827', emoji: '👋' },
  { id: '28', category: 'History', fact: 'The ancient Egyptians used to sleep on pillows made of stone', emoji: '🛏️' },
  { id: '29', category: 'History', fact: 'The shortest reigning monarch in history ruled for just 20 minutes', emoji: '👑' },
  { id: '30', category: 'History', fact: 'The word "set" has the most definitions in the English language (464 different meanings)', emoji: '📖' },
  
  // Space & Astronomy
  { id: '31', category: 'Space', fact: 'There are more stars in the universe than grains of sand on all the beaches on Earth', emoji: '⭐' },
  { id: '32', category: 'Space', fact: 'A neutron star can spin 600 times per second', emoji: '⭐' },
  { id: '33', category: 'Space', fact: 'The Sun contains 99.86% of the Solar System\'s mass', emoji: '☀️' },
  { id: '34', category: 'Space', fact: 'One day on Mercury equals 176 Earth days', emoji: '☿️' },
  { id: '35', category: 'Space', fact: 'The International Space Station travels at 17,500 mph', emoji: '🚀' },
  { id: '36', category: 'Space', fact: 'There\'s a planet made entirely of diamonds', emoji: '💎' },
  { id: '37', category: 'Space', fact: 'The Moon is moving away from Earth at about 1.5 inches per year', emoji: '🌙' },
  { id: '38', category: 'Space', fact: 'A year on Pluto is 248 Earth years', emoji: '🪐' },
  { id: '39', category: 'Space', fact: 'The largest volcano in the solar system is on Mars', emoji: '🌋' },
  { id: '40', category: 'Space', fact: 'There are more possible arrangements of a deck of cards than atoms on Earth', emoji: '🃏' },
  
  // Human Body & Biology
  { id: '41', category: 'Biology', fact: 'Your stomach gets a new lining every 3-5 days', emoji: '🫀' },
  { id: '42', category: 'Biology', fact: 'The human body produces 25 million new cells every second', emoji: '🔬' },
  { id: '43', category: 'Biology', fact: 'Your heart beats about 100,000 times per day', emoji: '❤️' },
  { id: '44', category: 'Biology', fact: 'The strongest muscle in the human body is the masseter (jaw muscle)', emoji: '💪' },
  { id: '45', category: 'Biology', fact: 'Humans share 50% of their DNA with bananas', emoji: '🍌' },
  { id: '46', category: 'Biology', fact: 'Your brain uses 20% of your body\'s total energy', emoji: '🧠' },
  { id: '47', category: 'Biology', fact: 'The human eye can distinguish about 10 million different colors', emoji: '👁️' },
  { id: '48', category: 'Biology', fact: 'You have about 37 trillion cells in your body', emoji: '🔬' },
  { id: '49', category: 'Biology', fact: 'Your fingernails grow faster on your dominant hand', emoji: '💅' },
  { id: '50', category: 'Biology', fact: 'The human nose can remember 50,000 different scents', emoji: '👃' },
  
  // Psychology & Learning
  { id: '51', category: 'Psychology', fact: 'The average person has about 70,000 thoughts per day', emoji: '💭' },
  { id: '52', category: 'Psychology', fact: 'It takes about 66 days to form a new habit', emoji: '🔄' },
  { id: '53', category: 'Psychology', fact: 'The "forgetting curve" shows we forget 50% of new information within an hour', emoji: '📉' },
  { id: '54', category: 'Psychology', fact: 'Spaced repetition is 200% more effective than cramming', emoji: '📚' },
  { id: '55', category: 'Psychology', fact: 'The brain processes visual information 60,000 times faster than text', emoji: '👀' },
  { id: '56', category: 'Psychology', fact: 'Multitasking reduces productivity by up to 40%', emoji: '⚡' },
  { id: '57', category: 'Psychology', fact: 'The "testing effect" shows that testing yourself improves learning more than re-reading', emoji: '📝' },
  { id: '58', category: 'Psychology', fact: 'Sleep is crucial for memory consolidation - you learn while you sleep!', emoji: '😴' },
  { id: '59', category: 'Psychology', fact: 'The "spacing effect" means learning is more effective when spread over time', emoji: '⏰' },
  { id: '60', category: 'Psychology', fact: 'Active recall is 3x more effective than passive reading', emoji: '🧠' },
  
  // Geography & Earth
  { id: '61', category: 'Geography', fact: 'The Pacific Ocean is larger than all land masses combined', emoji: '🌊' },
  { id: '62', category: 'Geography', fact: 'Antarctica is the world\'s largest desert', emoji: '🏔️' },
  { id: '63', category: 'Geography', fact: 'The Amazon rainforest produces 20% of the world\'s oxygen', emoji: '🌳' },
  { id: '64', category: 'Geography', fact: 'There are more than 7,000 languages spoken in the world today', emoji: '🗣️' },
  { id: '65', category: 'Geography', fact: 'The deepest point on Earth is the Mariana Trench (36,000 feet deep)', emoji: '🌊' },
  { id: '66', category: 'Geography', fact: 'Iceland has no mosquitoes', emoji: '🦟' },
  { id: '67', category: 'Geography', fact: 'The Sahara Desert is expanding at a rate of 0.5 miles per year', emoji: '🏜️' },
  { id: '68', category: 'Geography', fact: 'There are more than 2,000 islands in the Philippines', emoji: '🏝️' },
  { id: '69', category: 'Geography', fact: 'The Great Barrier Reef is visible from space', emoji: '🐠' },
  { id: '70', category: 'Geography', fact: 'Mount Everest grows about 4mm taller every year', emoji: '🏔️' },
  
  // Food & Nutrition
  { id: '71', category: 'Food', fact: 'Carrots were originally purple, not orange', emoji: '🥕' },
  { id: '72', category: 'Food', fact: 'The world\'s most expensive coffee is made from civet poop', emoji: '☕' },
  { id: '73', category: 'Food', fact: 'Pineapples take 2-3 years to grow', emoji: '🍍' },
  { id: '74', category: 'Food', fact: 'The average person eats about 35,000 cookies in their lifetime', emoji: '🍪' },
  { id: '75', category: 'Food', fact: 'Chocolate was once used as currency by the Aztecs', emoji: '🍫' },
  { id: '76', category: 'Food', fact: 'The world\'s largest pizza was 122 feet in diameter', emoji: '🍕' },
  { id: '77', category: 'Food', fact: 'Apples float because 25% of their volume is air', emoji: '🍎' },
  { id: '78', category: 'Food', fact: 'The fear of long words is called "hippopotomonstrosesquippedaliophobia"', emoji: '📚' },
  { id: '79', category: 'Food', fact: 'The world\'s most expensive spice is saffron', emoji: '🌿' },
  { id: '80', category: 'Food', fact: 'A single strawberry can have up to 200 seeds', emoji: '🍓' },
  
  // Animals & Nature
  { id: '81', category: 'Animals', fact: 'A group of owls is called a "parliament"', emoji: '🦉' },
  { id: '82', category: 'Animals', fact: 'Dolphins have names for each other', emoji: '🐬' },
  { id: '83', category: 'Animals', fact: 'A group of crows is called a "murder"', emoji: '🐦‍⬛' },
  { id: '84', category: 'Animals', fact: 'Elephants can\'t jump', emoji: '🐘' },
  { id: '85', category: 'Animals', fact: 'A group of rhinos is called a "crash"', emoji: '🦏' },
  { id: '86', category: 'Animals', fact: 'Butterflies taste with their feet', emoji: '🦋' },
  { id: '87', category: 'Animals', fact: 'A group of penguins is called a "waddle"', emoji: '🐧' },
  { id: '88', category: 'Animals', fact: 'Giraffes have the same number of neck vertebrae as humans', emoji: '🦒' },
  { id: '89', category: 'Animals', fact: 'A group of jellyfish is called a "smack"', emoji: '🪼' },
  { id: '90', category: 'Animals', fact: 'Cats spend 70% of their lives sleeping', emoji: '🐱' },
  
  // Mathematics & Numbers
  { id: '91', category: 'Math', fact: 'Zero was invented in India around the 5th century', emoji: '0️⃣' },
  { id: '92', category: 'Math', fact: 'The number 40 is the only number whose letters are in alphabetical order', emoji: '4️⃣' },
  { id: '93', category: 'Math', fact: 'A "jiffy" is an actual unit of time - 1/100th of a second', emoji: '⏱️' },
  { id: '94', category: 'Math', fact: 'The number 142857 has a special property - when multiplied by 1-6, it produces the same digits in different orders', emoji: '🔢' },
  { id: '95', category: 'Math', fact: 'Pi has been calculated to over 31 trillion decimal places', emoji: '🥧' },
  { id: '96', category: 'Math', fact: 'The Fibonacci sequence appears in nature more often than you\'d think', emoji: '🐚' },
  { id: '97', category: 'Math', fact: 'The number 9 is magical - multiply any number by 9, add the digits, and you\'ll always get 9', emoji: '9️⃣' },
  { id: '98', category: 'Math', fact: 'There are more possible arrangements of a deck of cards than atoms on Earth', emoji: '🃏' },
  { id: '99', category: 'Math', fact: 'The word "hundred" comes from the Old Norse "hundrath" meaning 120', emoji: '💯' },
  { id: '100', category: 'Math', fact: 'The number 7 is considered lucky in many cultures around the world', emoji: '7️⃣' }
];

// How to add more facts:
// 1. Follow this exact format:
//    { id: 'unique_id', category: 'Category Name', fact: 'Your interesting fact here', emoji: '🎯' }
//
// 2. Make sure each fact has:
//    - A unique ID (use the next number in sequence)
//    - A category (Science, Technology, History, etc.)
//    - An interesting, educational fact
//    - A relevant emoji
//
// 3. Categories you can use:
//    - Science, Technology, History, Space, Biology, Psychology, Geography, Food, Animals, Math
//    - Or create new categories like: Medicine, Art, Sports, Music, etc.
//
// 4. Example of adding a new fact:
//    { id: '101', category: 'Medicine', fact: 'The human body has enough iron to make a 3-inch nail', emoji: '🔩' }
//
// 5. To add 1000+ facts, you can:
//    - Add them manually following the pattern above
//    - Use a script to generate facts from a database
//    - Import facts from external APIs
//    - Use AI to generate educational facts
//
// 6. Tips for good facts:
//    - Make them surprising or counterintuitive
//    - Keep them educational and accurate
//    - Make them engaging and fun
//    - Use specific numbers when possible
//    - Choose facts that are appropriate for all ages
