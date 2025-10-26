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
  { id: '100', category: 'Math', fact: 'The number 7 is considered lucky in many cultures around the world', emoji: '7️⃣' },
  
  // Medicine & Health
  { id: '101', category: 'Medicine', fact: 'The human body has enough iron to make a 3-inch nail', emoji: '🔩' },
  { id: '102', category: 'Medicine', fact: 'Your body produces 1.5 liters of saliva every day', emoji: '💧' },
  { id: '103', category: 'Medicine', fact: 'The human body contains enough carbon to fill 9,000 pencils', emoji: '✏️' },
  { id: '104', category: 'Medicine', fact: 'Your blood travels 12,000 miles through your body every day', emoji: '🩸' },
  { id: '105', category: 'Medicine', fact: 'The human body has enough phosphorus to make 2,200 match heads', emoji: '🔥' },
  { id: '106', category: 'Medicine', fact: 'Your body produces 25 million new cells every second', emoji: '🔬' },
  { id: '107', category: 'Medicine', fact: 'The human brain uses 20% of the body\'s total energy', emoji: '🧠' },
  { id: '108', category: 'Medicine', fact: 'Your body has enough sulfur to kill all fleas on an average dog', emoji: '🐕' },
  { id: '109', category: 'Medicine', fact: 'The human body contains enough water to fill a 10-gallon tank', emoji: '💧' },
  { id: '110', category: 'Medicine', fact: 'Your body produces enough heat in 30 minutes to boil half a gallon of water', emoji: '🌡️' },
  
  // Art & Culture
  { id: '111', category: 'Art', fact: 'The Mona Lisa has no eyebrows because it was fashionable to shave them off in Renaissance Florence', emoji: '🎨' },
  { id: '112', category: 'Art', fact: 'Vincent van Gogh only sold one painting during his lifetime', emoji: '🌻' },
  { id: '113', category: 'Art', fact: 'The Great Pyramid of Giza was originally covered in polished white limestone', emoji: '🏺' },
  { id: '114', category: 'Art', fact: 'The Sistine Chapel ceiling took Michelangelo 4 years to paint', emoji: '⛪' },
  { id: '115', category: 'Art', fact: 'The Statue of Liberty was originally brown, but turned green due to oxidation', emoji: '🗽' },
  { id: '116', category: 'Art', fact: 'The world\'s oldest known musical instrument is a 40,000-year-old flute made from bone', emoji: '🎵' },
  { id: '117', category: 'Art', fact: 'The color orange was named after the fruit, not the other way around', emoji: '🧡' },
  { id: '118', category: 'Art', fact: 'The world\'s largest painting is 1,200 feet long and weighs 22,000 pounds', emoji: '🖼️' },
  { id: '119', category: 'Art', fact: 'The first photograph ever taken required an 8-hour exposure time', emoji: '📸' },
  { id: '120', category: 'Art', fact: 'The world\'s most expensive painting sold for $450.3 million', emoji: '💰' },
  
  // Sports & Recreation
  { id: '121', category: 'Sports', fact: 'A golf ball has 336 dimples on its surface', emoji: '⛳' },
  { id: '122', category: 'Sports', fact: 'The fastest recorded tennis serve was 163.7 mph', emoji: '🎾' },
  { id: '123', category: 'Sports', fact: 'A basketball player can jump up to 48 inches high', emoji: '🏀' },
  { id: '124', category: 'Sports', fact: 'The longest recorded baseball game lasted 8 hours and 25 minutes', emoji: '⚾' },
  { id: '125', category: 'Sports', fact: 'A soccer ball travels at speeds up to 70 mph when kicked', emoji: '⚽' },
  { id: '126', category: 'Sports', fact: 'The Olympic torch has been to space three times', emoji: '🔥' },
  { id: '127', category: 'Sports', fact: 'A hockey puck can reach speeds of 100 mph', emoji: '🏒' },
  { id: '128', category: 'Sports', fact: 'The first Olympic Games were held in 776 BC', emoji: '🏛️' },
  { id: '129', category: 'Sports', fact: 'A marathon runner burns about 2,600 calories during a race', emoji: '🏃' },
  { id: '130', category: 'Sports', fact: 'The world\'s fastest human can run 100 meters in 9.58 seconds', emoji: '🏃‍♂️' },
  
  // Music & Entertainment
  { id: '131', category: 'Music', fact: 'The world\'s longest song is 1,380 hours long', emoji: '🎵' },
  { id: '132', category: 'Music', fact: 'The Beatles\' "Hey Jude" is 7 minutes and 11 seconds long', emoji: '🎸' },
  { id: '133', category: 'Music', fact: 'A piano has 88 keys and over 12,000 parts', emoji: '🎹' },
  { id: '134', category: 'Music', fact: 'The world\'s most expensive guitar sold for $2.7 million', emoji: '🎸' },
  { id: '135', category: 'Music', fact: 'The human voice can produce over 1,000 different sounds', emoji: '🎤' },
  { id: '136', category: 'Music', fact: 'The world\'s largest drum is 12 feet in diameter', emoji: '🥁' },
  { id: '137', category: 'Music', fact: 'A violin has over 70 different parts', emoji: '🎻' },
  { id: '138', category: 'Music', fact: 'The world\'s longest concert lasted 639 hours', emoji: '🎼' },
  { id: '139', category: 'Music', fact: 'The human ear can distinguish between 1,400 different pitches', emoji: '👂' },
  { id: '140', category: 'Music', fact: 'The world\'s most expensive violin sold for $16 million', emoji: '🎻' },
  
  // Language & Communication
  { id: '141', category: 'Language', fact: 'The word "set" has 464 different meanings in English', emoji: '📖' },
  { id: '142', category: 'Language', fact: 'The shortest complete sentence in English is "I am"', emoji: '💬' },
  { id: '143', category: 'Language', fact: 'The word "queue" is pronounced the same way even if you remove the last 4 letters', emoji: '📝' },
  { id: '144', category: 'Language', fact: 'The longest word in English has 189,819 letters', emoji: '🔤' },
  { id: '145', category: 'Language', fact: 'The word "hello" was first used as a greeting in 1827', emoji: '👋' },
  { id: '146', category: 'Language', fact: 'The word "goodbye" comes from "God be with you"', emoji: '👋' },
  { id: '147', category: 'Language', fact: 'The word "girl" originally meant "young person of either sex"', emoji: '👧' },
  { id: '148', category: 'Language', fact: 'The word "nice" originally meant "foolish" or "silly"', emoji: '😊' },
  { id: '149', category: 'Language', fact: 'The word "awful" originally meant "full of awe"', emoji: '😨' },
  { id: '150', category: 'Language', fact: 'The word "silly" originally meant "blessed" or "happy"', emoji: '😄' },
  
  // Weather & Climate
  { id: '151', category: 'Weather', fact: 'Lightning strikes the Earth 100 times every second', emoji: '⚡' },
  { id: '152', category: 'Weather', fact: 'A single lightning bolt can heat the air to 50,000°F', emoji: '🔥' },
  { id: '153', category: 'Weather', fact: 'The coldest temperature ever recorded was -128.6°F in Antarctica', emoji: '❄️' },
  { id: '154', category: 'Weather', fact: 'The hottest temperature ever recorded was 134°F in Death Valley', emoji: '🌡️' },
  { id: '155', category: 'Weather', fact: 'A single raindrop can contain up to 1 million water molecules', emoji: '💧' },
  { id: '156', category: 'Weather', fact: 'The world\'s largest hailstone weighed 1.93 pounds', emoji: '🧊' },
  { id: '157', category: 'Weather', fact: 'A tornado can reach speeds of 300 mph', emoji: '🌪️' },
  { id: '158', category: 'Weather', fact: 'The world\'s largest snowflake was 15 inches wide', emoji: '❄️' },
  { id: '159', category: 'Weather', fact: 'A single cloud can weigh more than a million pounds', emoji: '☁️' },
  { id: '160', category: 'Weather', fact: 'The world\'s driest place gets less than 0.03 inches of rain per year', emoji: '🏜️' },
  
  // Transportation & Travel
  { id: '161', category: 'Transport', fact: 'The world\'s fastest train can reach 375 mph', emoji: '🚄' },
  { id: '162', category: 'Transport', fact: 'A commercial airplane can fly at altitudes up to 45,000 feet', emoji: '✈️' },
  { id: '163', category: 'Transport', fact: 'The world\'s longest bridge is 102.4 miles long', emoji: '🌉' },
  { id: '164', category: 'Transport', fact: 'A car has over 30,000 parts', emoji: '🚗' },
  { id: '165', category: 'Transport', fact: 'The world\'s largest ship can carry 20,000 containers', emoji: '🚢' },
  { id: '166', category: 'Transport', fact: 'A bicycle is the most efficient form of transportation', emoji: '🚲' },
  { id: '167', category: 'Transport', fact: 'The world\'s fastest car can reach 304 mph', emoji: '🏎️' },
  { id: '168', category: 'Transport', fact: 'A helicopter can fly backwards', emoji: '🚁' },
  { id: '169', category: 'Transport', fact: 'The world\'s longest tunnel is 35.4 miles long', emoji: '🚇' },
  { id: '170', category: 'Transport', fact: 'A hot air balloon can reach altitudes of 68,000 feet', emoji: '🎈' },
  
  // Time & Calendars
  { id: '171', category: 'Time', fact: 'A day on Mercury lasts 176 Earth days', emoji: '☿️' },
  { id: '172', category: 'Time', fact: 'A year on Pluto lasts 248 Earth years', emoji: '🪐' },
  { id: '173', category: 'Time', fact: 'The world\'s most accurate clock loses only 1 second every 15 billion years', emoji: '⏰' },
  { id: '174', category: 'Time', fact: 'A leap year occurs every 4 years, except for years divisible by 100', emoji: '📅' },
  { id: '175', category: 'Time', fact: 'The world\'s oldest known calendar is 10,000 years old', emoji: '🗓️' },
  { id: '176', category: 'Time', fact: 'A second is defined as 9,192,631,770 oscillations of a cesium atom', emoji: '⏱️' },
  { id: '177', category: 'Time', fact: 'The world\'s most accurate sundial can tell time within 15 seconds', emoji: '☀️' },
  { id: '178', category: 'Time', fact: 'A day on Venus lasts 243 Earth days', emoji: '♀️' },
  { id: '179', category: 'Time', fact: 'The world\'s longest day of the year is the summer solstice', emoji: '🌞' },
  { id: '180', category: 'Time', fact: 'A year on Jupiter lasts 12 Earth years', emoji: '♃' },
  
  // Colors & Light
  { id: '181', category: 'Colors', fact: 'The human eye can see 10 million different colors', emoji: '👁️' },
  { id: '182', category: 'Colors', fact: 'The color red increases heart rate and blood pressure', emoji: '❤️' },
  { id: '183', category: 'Colors', fact: 'The color blue is the most popular color in the world', emoji: '💙' },
  { id: '184', category: 'Colors', fact: 'The color yellow is the most visible color in daylight', emoji: '💛' },
  { id: '185', category: 'Colors', fact: 'The color green is the most restful color for the human eye', emoji: '💚' },
  { id: '186', category: 'Colors', fact: 'The color purple was once so expensive only royalty could afford it', emoji: '💜' },
  { id: '187', category: 'Colors', fact: 'The color orange was named after the fruit', emoji: '🧡' },
  { id: '188', category: 'Colors', fact: 'The color pink is actually a tint of red', emoji: '💗' },
  { id: '189', category: 'Colors', fact: 'The color black absorbs all light wavelengths', emoji: '🖤' },
  { id: '190', category: 'Colors', fact: 'The color white reflects all light wavelengths', emoji: '🤍' },
  
  // Emotions & Psychology
  { id: '191', category: 'Psychology', fact: 'Laughter reduces stress hormones and increases immune cells', emoji: '😄' },
  { id: '192', category: 'Psychology', fact: 'Crying releases endorphins that make you feel better', emoji: '😢' },
  { id: '193', category: 'Psychology', fact: 'Smiling can actually make you feel happier', emoji: '😊' },
  { id: '194', category: 'Psychology', fact: 'The human brain processes emotions 200 times faster than thoughts', emoji: '🧠' },
  { id: '195', category: 'Psychology', fact: 'Hugging releases oxytocin, the "love hormone"', emoji: '🤗' },
  { id: '196', category: 'Psychology', fact: 'The human brain can only focus on one thing at a time', emoji: '🎯' },
  { id: '197', category: 'Psychology', fact: 'The human brain uses 20% of the body\'s total energy', emoji: '⚡' },
  { id: '198', category: 'Psychology', fact: 'The human brain contains 100 billion neurons', emoji: '🧠' },
  { id: '199', category: 'Psychology', fact: 'The human brain can process information at 120 bits per second', emoji: '💭' },
  { id: '200', category: 'Psychology', fact: 'The human brain is 75% water', emoji: '💧' }
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
