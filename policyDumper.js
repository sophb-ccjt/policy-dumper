function dumpPolicies(logging = 1) {
	if (location.href !== 'chrome://policy/')
		throw new Error('You have to be in the `chrome://policy/` page for the dumper to access your policies.');

	const minLoggingLevel = 0,
		  maxLoggingLevel = 3;
	if (logging < minLoggingLevel) {
		console.error(new RangeError(`Logging level is lower than the minimum (${minLoggingLevel}). Defaulting to ${minLoggingLevel}.`));
		logging = minLoggingLevel;
	}
	if (logging > maxLoggingLevel) {
		console.error(new RangeError(`Logging level is higher than the maximum (${maxLoggingLevel}). Defaulting to ${maxLoggingLevel}.`));
		logging = maxLoggingLevel;
	}

	function downloadFileWithContent(filename = `Untitled file [${Date.now()}]`, content = '') {
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		return content;
	};

	if (logging >= 1) console.log('Starting...');
	const policy = {};
	const policyRows = document.body.querySelector('policy-table').shadowRoot.querySelectorAll('.main policy-row');

	if (logging >= 2) console.log('Dumping policies...');
	for (const [index, policyRow] of policyRows.entries()) {
		let policyName;
		const policyValues = {};

		// loop through policy row's values and set each key to their respective value
		const policyValueElements = policyRow.shadowRoot.querySelector('.policy.row').children;
		for (const policyElement of policyValueElements) {
			const className = [...policyElement.classList].filter(v => v !== 'row')[0];
			switch (className) {
				case 'name':
					policyName = policyElement.querySelector('.link #name').textContent;
					if (logging >= 2) console.log(`Dumping policy '${policyName}' (${index + 1} of ${policyRows.length})...`);
					break;

				case 'value':
					policyValues.value = policyElement?.textContent ?? 'missing value!!';
					if (logging >= 3) console.log(`Value of policy '${policyName}': ${policyValues.value}`);
					break;

				case 'source':
					policyValues.source = policyElement?.textContent ?? 'missing value!!';
					if (logging >= 3) console.log(`Source of policy '${policyName}': ${policyValues.source}`);
					break;

				case 'scope':
					policyValues.scope = policyElement.textContent ?? 'missing value!!';
					if (logging >= 3) console.log(`Policy '${policyName}' applies to: ${policyValues.scope}`);
					break;

				case 'level':
					policyValues.level = policyElement.textContent ?? 'missing value!!';
					if (logging >= 3) console.log(`Restriction level of policy '${policyName}': ${policyValues.level}`);
					break;

				case 'messages':
					policyValues.status = policyElement.textContent ?? 'missing value!!';
					if (logging >= 3) {
						console.log(`Status of policy '${policyName}': ${policyValues.status}`);
						if (policyValues.status === 'Not set.') {
							console.log(`Policy '${policyName}' not set. Omitting...`);
							delete policy[policyName];
							continue;
						}
					}
					break;
			}
		}
	}

	if (logging >= 2) console.log('Downloading file...');
	downloadFileWithContent(`Policy dump [${Date.now()}].json`, JSON.stringify(policy, null, 4));

	if (logging >= 1) console.log('Done!');
}
dumpPolicies();
