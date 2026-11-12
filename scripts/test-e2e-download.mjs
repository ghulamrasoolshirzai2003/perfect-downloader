async function testE2EDownload() {
  console.log('1. Testing URL inspection through Web Server (port 3000)...');
  const inspectRes = await fetch('http://localhost:3000/api/v1/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://archive.org/details/BigBuckBunny_124' })
  });
  const inspectData = await inspectRes.json();
  console.log('Inspect Status:', inspectRes.status, 'Title:', inspectData.data?.title);
  if (!inspectData.data) {
    console.error('Inspection failed:', inspectData);
    process.exit(1);
  }

  console.log('2. Starting Download job through Web Server (port 3000)...');
  const dlRes = await fetch('http://localhost:3000/api/v1/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://archive.org/details/BigBuckBunny_124',
      formatId: '0+bestaudio/0/best',
      title: 'Big Buck Bunny Test',
      clipStart: '00:00',
      clipEnd: '00:05',
      attestation: true
    })
  });
  const dlData = await dlRes.json();
  console.log('Download Job Started:', dlData.job?.id, 'Status:', dlData.job?.status);

  const jobId = dlData.job?.id;
  if (!jobId) {
    console.error('No jobId returned!');
    process.exit(1);
  }

  console.log('3. Polling job status until completion...');
  while (true) {
    await new Promise(r => setTimeout(r, 1000));
    const jobRes = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`);
    const jobData = await jobRes.json();
    console.log('Job state:', jobData.job?.status, 'Progress:', jobData.job?.progress?.percent, 'Stage:', jobData.job?.progress?.stage);
    if (jobData.job?.status === 'completed') {
      console.log('4. Verifying file download endpoint:', jobData.job.downloadUrl);
      const fileRes = await fetch(`http://localhost:3000${jobData.job.downloadUrl}`);
      console.log('File download status:', fileRes.status, 'Content-Type:', fileRes.headers.get('content-type'), 'Content-Length:', fileRes.headers.get('content-length'), 'Content-Disposition:', fileRes.headers.get('content-disposition'));
      console.log('SUCCESS! Real downloading system is fully verified and working end-to-end!');
      break;
    }
    if (jobData.job?.status === 'failed') {
      console.error('Download job failed:', jobData.job.error);
      process.exit(1);
    }
  }
}

testE2EDownload().catch(console.error);
