const { getClient } = require('./src/lib/db');
const { prisma } = require('./src/lib/prisma');

async function checkDocuments() {
  try {
    console.log('🔍 Checking documents in both databases...\n');

    // Check Neon database (PostgreSQL)
    console.log('📊 Neon Database (PostgreSQL):');
    const neonDocs = await prisma.document.findMany({
      select: {
        id: true,
        fileName: true,
        title: true,
        professorName: true,
        courseCode: true,
        topic: true,
        uploadedAt: true
      }
    });
    
    console.log(`Total documents in Neon: ${neonDocs.length}`);
    neonDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} by ${doc.professorName} (${doc.courseCode})`);
    });

    // Check for Professor Omale specifically
    const omaleDocs = neonDocs.filter(doc => 
      doc.professorName.toLowerCase().includes('omale')
    );
    console.log(`\n📚 Professor Omale documents in Neon: ${omaleDocs.length}`);
    omaleDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.courseCode}) - ${doc.topic}`);
    });

    // Check Astra DB (Vector database)
    console.log('\n🗄️ Astra DB (Vector Database):');
    const client = await getClient();
    const documentsCollection = client.collection('documents');
    const chunksCollection = client.collection('document_chunks');
    
    const astraDocs = await documentsCollection.find({}).toArray();
    console.log(`Total documents in Astra: ${astraDocs.length}`);
    astraDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} by ${doc.professor_name} (${doc.course_code})`);
    });

    // Check for Professor Omale in Astra
    const omaleAstraDocs = astraDocs.filter(doc => 
      doc.professor_name && doc.professor_name.toLowerCase().includes('omale')
    );
    console.log(`\n📚 Professor Omale documents in Astra: ${omaleAstraDocs.length}`);
    omaleAstraDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.course_code}) - ${doc.topic}`);
    });

    // Check chunks for Professor Omale
    const omaleChunks = await chunksCollection.find({
      "metadata.professorName": { $regex: /omale/i }
    }).toArray();
    console.log(`\n🧩 Professor Omale chunks in Astra: ${omaleChunks.length}`);
    
    if (omaleChunks.length > 0) {
      console.log('Sample chunk metadata:');
      console.log(JSON.stringify(omaleChunks[0].metadata, null, 2));
    }

    // Check if there are any chunks at all
    const totalChunks = await chunksCollection.countDocuments({});
    console.log(`\n📦 Total chunks in database: ${totalChunks}`);

    // Check for any chunks with embeddings
    const chunksWithEmbeddings = await chunksCollection.countDocuments({
      $vector: { $exists: true }
    });
    console.log(`🔢 Chunks with embeddings: ${chunksWithEmbeddings}`);

  } catch (error) {
    console.error('❌ Error checking documents:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkDocuments();
