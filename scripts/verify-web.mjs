async function test() {
  try {
    const res = await fetch('http://localhost:3000');
    const text = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Title:', text.match(/<title>(.*?)<\/title>/)?.[1]);
    console.log('Has #nt:', text.includes('id="nt"'));
    console.log('Has #app:', text.includes('id="app"'));
    console.log('Has #toast:', text.includes('id="toast"'));
    console.log('Has prototype.js:', text.includes('/prototype.js'));

    const jsRes = await fetch('http://localhost:3000/prototype.js');
    console.log('prototype.js status:', jsRes.status);
    const jsText = await jsRes.text();
    console.log('prototype.js length:', jsText.length);
  } catch (err) {
    console.error('Error fetching:', err);
  }
}
test();
