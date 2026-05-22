async function dumpPolicies(options = {}) {
    const config = {
        logging: 1,
        format: 'json',
        includeUnset: false,
        includeMeta: true,
        sortPolicies: true,
        groupBySource: true,
        groupByScope: true,
        compressOutput: false,
        filter: null,
        filenamePrefix: 'PolicyIntel',
        ...options
    };

    const log = (...args) => {
        if (config.logging > 0) {
            console.log('[PolicyIntel]', ...args);
        }
    };

    const createDownload = (filename, content, mime) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const rows = document.body
        .querySelector('policy-table')
        ?.shadowRoot
        ?.querySelectorAll('.main policy-row');

    if (!rows?.length) {
        throw new Error('No policies found.');
    }

    const data = {
        generated: new Date().toISOString(),
        browser: navigator.userAgent,
        totals: {
            total: rows.length,
            exported: 0,
            skipped: 0
        },
        groups: {
            sources: {},
            scopes: {}
        },
        policies: {}
    };

    const normalize = value =>
        String(value || '')
            .replace(/\s+/g, ' ')
            .trim();

    for (const row of rows) {
        try {
            const elements = row
                .shadowRoot
                ?.querySelector('.policy.row')
                ?.children;

            if (!elements) {
                data.totals.skipped++;
                continue;
            }

            let name = 'UnknownPolicy';

            const policy = {
                value: '',
                source: '',
                scope: '',
                level: '',
                status: '',
                detectedType: '',
                valueLength: 0,
                modified: Date.now()
            };

            for (const element of elements) {
                const type = [...element.classList]
                    .find(v => v !== 'row');

                switch (type) {
                    case 'name':
                        name = normalize(
                            element.querySelector('.link #name')?.textContent
                        ) || 'UnnamedPolicy';
                        break;

                    case 'value':
                        policy.value = normalize(element.textContent);
                        break;

                    case 'source':
                        policy.source = normalize(element.textContent);
                        break;

                    case 'scope':
                        policy.scope = normalize(element.textContent);
                        break;

                    case 'level':
                        policy.level = normalize(element.textContent);
                        break;

                    case 'messages':
                        policy.status = normalize(element.textContent);
                        break;
                }
            }

            if (
                !config.includeUnset &&
                policy.status.toLowerCase().includes('not set')
            ) {
                data.totals.skipped++;
                continue;
            }

            if (
                config.filter &&
                !config.filter.test(name)
            ) {
                data.totals.skipped++;
                continue;
            }

            policy.valueLength = policy.value.length;

            if (/true|false/i.test(policy.value)) {
                policy.detectedType = 'boolean';
            } else if (!isNaN(policy.value)) {
                policy.detectedType = 'number';
            } else if (
                policy.value.startsWith('{') ||
                policy.value.startsWith('[')
            ) {
                policy.detectedType = 'object';
            } else {
                policy.detectedType = 'string';
            }

            data.policies[name] = policy;

            if (config.groupBySource) {
                if (!data.groups.sources[policy.source]) {
                    data.groups.sources[policy.source] = [];
                }

                data.groups.sources[policy.source].push(name);
            }

            if (config.groupByScope) {
                if (!data.groups.scopes[policy.scope]) {
                    data.groups.scopes[policy.scope] = [];
                }

                data.groups.scopes[policy.scope].push(name);
            }

            data.totals.exported++;
        } catch {
            data.totals.skipped++;
        }
    }

    if (config.sortPolicies) {
        data.policies = Object.fromEntries(
            Object.entries(data.policies)
                .sort((a, b) => a[0].localeCompare(b[0]))
        );
    }

    const summary = {
        exported: data.totals.exported,
        skipped: data.totals.skipped,
        sources: Object.keys(data.groups.sources).length,
        scopes: Object.keys(data.groups.scopes).length
    };

    console.table(summary);

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-');

    const file = `${config.filenamePrefix}_${timestamp}.${config.format}`;

    let output;

    if (config.format === 'csv') {
        const csv = [
            [
                'Policy',
                'Value',
                'Source',
                'Scope',
                'Level',
                'Status',
                'Type',
                'Length'
            ]
        ];

        for (const [name, policy] of Object.entries(data.policies)) {
            csv.push([
                name,
                policy.value,
                policy.source,
                policy.scope,
                policy.level,
                policy.status,
                policy.detectedType,
                policy.valueLength
            ]);
        }

        output = csv
            .map(row =>
                row
                    .map(value =>
                        `"${String(value).replace(/"/g, '""')}"`
                    )
                    .join(',')
            )
            .join('\n');

        createDownload(file, output, 'text/csv');
    } else {
        output = config.compressOutput
            ? JSON.stringify(data)
            : JSON.stringify(data, null, 4);

        createDownload(file, output, 'application/json');
    }

    log('Export finished:', file);

    return {
        file,
        summary,
        data
    };
}