const fs = require('fs');
const path = require('path');
const dirs = fs.readdirSync('d:/Semms/Snet/supabase/functions', { withFileTypes: true }).filter(d => d.isDirectory());

let changedFiles = 0;

dirs.forEach(d => {
    const filePath = path.join('d:/Semms/Snet/supabase/functions', d.name, 'index.ts');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Skip OPTIONS as they are just 'ok'
        // We only want to replace headers for JSON responses.
        content = content.replace(/new Response\(JSON\.stringify\((.*?)\),\s*\{\s*headers:\s*corsHeaders\s*\}\)/g,
            'new Response(JSON.stringify($1), { headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } })');

        content = content.replace(/new Response\(JSON\.stringify\((.*?)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*corsHeaders\s*\}\)/g,
            'new Response(JSON.stringify($1), { status: $2, headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } })');

        content = content.replace(/new Response\(JSON\.stringify\((.*?)\),\s*\{\s*headers:\s*corsHeaders,\s*status:\s*(\d+)\s*\}\)/g,
            'new Response(JSON.stringify($1), { headers: { ...corsHeaders, \'Content-Type\': \'application/json\' }, status: $2 })');

        content = content.replace(/new Response\(\s*JSON\.stringify\((.*?)\),\s*\{\s*headers:\s*corsHeaders\s*\}\s*\)/g,
            'new Response(JSON.stringify($1), { headers: { ...corsHeaders, \'Content-Type\': \'application/json\' } })');

        // Edge cases like multi-line where it just says `headers: corsHeaders` inside the response object
        content = content.replace(/headers:\s*corsHeaders/g, 'headers: { ...corsHeaders, \'Content-Type\': \'application/json\' }');

        // Let's protect OPTIONS requests
        content = content.replace(/new Response\('ok',\s*\{\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*'Content-Type':\s*'application\/json'\s*\}\s*\}\)/g,
            'new Response(\'ok\', { headers: corsHeaders })');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            changedFiles++;
            console.log(`Updated ${d.name}`);
        }
    }
});
console.log(`Fixed headers in ${changedFiles} functions`);
