const { CIRCLE_SHA1, GITHUB_REPOSITORY, CIRCLE_PULL_REQUEST, CIRCLE_BRANCH } = process.env;

if (!CIRCLE_SHA1 || !GITHUB_REPOSITORY) {
  throw new Error('Missing CircleCI commit or repository environment variables');
}

const repository = GITHUB_REPOSITORY;
const acceptedTitle = /^(build|chore|ci|docs|feat|fix|hotfix|perf|refactor|revert|style|test)(\([a-z0-9._/-]+\))?:\s+\S.*$/;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'japcalculator-circleci',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }
  return response.json();
}

async function main() {
  const associated = await github(`/repos/${repository}/commits/${CIRCLE_SHA1}/pulls`);
  const pulls = associated.filter(
    (pull) => pull.state === 'open' && pull.base.repo.full_name.toLowerCase() === repository.toLowerCase(),
  );

  if (pulls.length === 0 && CIRCLE_PULL_REQUEST) {
    const match = CIRCLE_PULL_REQUEST.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (match) {
      const pull = await github(`/repos/${repository}/pulls/${match[1]}`);
      if (pull.state === 'open') pulls.push(pull);
    }
  }

  if (pulls.length === 0) {
    if (CIRCLE_BRANCH === 'main') {
      console.log('No open pull request on main; title check skipped.');
      return;
    }
    throw new Error('No open pull request found for this commit. Push a new commit after opening the PR.');
  }

  for (const pull of pulls) {
    if (!acceptedTitle.test(pull.title)) {
      throw new Error(`PR #${pull.number} has an invalid title: ${pull.title}. Use a conventional prefix such as chore:, fix:, or hotfix:.`);
    }
    console.log(`PR #${pull.number} title is valid: ${pull.title}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
