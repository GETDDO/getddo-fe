export default {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
        parserOpts: {
            // 팀 컨벤션의 `!HOTFIX` 타입은 `!`로 시작해 기본 conventional 파서가 못 읽으므로 헤더 패턴 확장
            headerPattern: /^(\w+|!HOTFIX)(?:\(([^)]*)\))?!?: (.+)$/,
            headerCorrespondence: ['type', 'scope', 'subject'],
        },
    },
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'style',
                'refactor',
                'test',
                'chore',
                'design',
                'comment',
                'rename',
                'remove',
                '!HOTFIX',
                'build',
                'ci',
                'perf',
                'revert',
            ],
        ],
    },
};
