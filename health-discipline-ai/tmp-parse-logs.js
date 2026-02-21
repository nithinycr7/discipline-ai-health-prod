const c = [];
process.stdin.on('data', d => c.push(d));
process.stdin.on('end', () => {
  const logs = JSON.parse(Buffer.concat(c).toString());
  logs.reverse().forEach(x => {
    const t = (x.timestamp || '').slice(0, 19);
    const m = x.textPayload || (x.jsonPayload && x.jsonPayload.message) || JSON.stringify(x.jsonPayload || '');
    if (m && m !== '""' && m !== '{}') {
      console.log(t + ' | ' + String(m).slice(0, 300));
    }
  });
});
