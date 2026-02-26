<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="LinoChat API",
 *     version="1.0.0",
 *     description="AI-powered customer support platform API",
 *     @OA\Contact(
 *         email="support@linochat.com",
 *         name="LinoChat Support"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8000/api",
 *     description="Local Development Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Enter your JWT token in the format: Bearer {token}"
 * )
 *
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication and registration"
 * )
 * @OA\Tag(
 *     name="Widget",
 *     description="Public widget API for customer chat"
 * )
 * @OA\Tag(
 *     name="Agent",
 *     description="Agent dashboard for managing chats and tickets"
 * )
 * @OA\Tag(
 *     name="Projects",
 *     description="Project management API"
 * )
 * @OA\Tag(
 *     name="Invitations",
 *     description="Agent invitation management"
 * )
 * @OA\Tag(
 *     name="Tickets",
 *     description="Support ticket management"
 * )
 */
abstract class ApiController extends Controller
{
    // Base controller for API documentation
}
