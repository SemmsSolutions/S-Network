const fs = require('fs');

const files = [
    'vendor-reply-review',
    'update-lead-status',
    'toggle-helpful-review',
    'log-call-lead',
    'get-vendor-analytics',
    'create-lead'
];

files.forEach(f => {
    const p = 'd:/Semms/Snet/supabase/functions/' + f + '/index.ts';
    let c = fs.readFileSync(p, 'utf8');

    c = c.replace(
        /const \{ data: \{ user \}, error: userError \} = await ([a-zA-Z0-9_]+)\.auth\.getUser\(\)/g,
        `const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await $1.auth.getUser(_token)`
    );

    c = c.replace(
        /const \{ data: \{ user \} \} = await ([a-zA-Z0-9_]+)\.auth\.getUser\(\);/g,
        `const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '');
        const { data: { user } } = await $1.auth.getUser(_token);`
    );

    // special case for log-call-lead:
    c = c.replace(
        /const \{ data: \{ user \}, error: userError \} = await userClient\.auth\.getUser\(\)\.catch\(\(\) => \(\{ data: \{ user: null \}, error: null \}\)\);/g,
        `const _authHeader = req.headers.get('Authorization');
        let _token = '';
        if (_authHeader) _token = _authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await userClient.auth.getUser(_token).catch(() => ({ data: { user: null }, error: null }));`
    );

    fs.writeFileSync(p, c);
    console.log('Fixed ' + f);
});
