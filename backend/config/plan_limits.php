<?php

return [
    'free' => [
        'max_projects' => 1,
        'max_agents' => 1,
        'max_articles' => 10,
        'max_chats_per_month' => 100,
    ],
    'starter' => [
        'max_projects' => 3,
        'max_agents' => 5,
        'max_articles' => 50,
        'max_chats_per_month' => 1000,
    ],
    'pro' => [
        'max_projects' => 10,
        'max_agents' => 20,
        'max_articles' => 200,
        'max_chats_per_month' => null, // unlimited
    ],
    'enterprise' => [
        'max_projects' => null,
        'max_agents' => null,
        'max_articles' => null,
        'max_chats_per_month' => null,
    ],
];
