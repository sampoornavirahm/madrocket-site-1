# Automation Test Guide

This project includes a comprehensive test automation suite designed to verify the multi-role functionality of the Sales Pipeline.

## Test Components

1.  **Logic Simulation (`src/tests/logic.test.ts`)**
    *   **Purpose**: Verifies that the service layer can handle concurrent requests from 9 users.
    *   **How to run**: `npm test src/tests/logic.test.ts`
    *   **Features**: Mocks Firebase and simulates 3 Admins, 3 Managers, and 3 Sales Reps acting simultaneously.

2.  **Integration Suite (`src/tests/automation.test.ts`)**
    *   **Purpose**: Real-world end-to-end testing with actual Firestore interactions and security rule verification.
    *   **Workflow**:
        1.  Initializes 9 separate Firebase app instances.
        2.  Creates 9 temporary users (via Anonymous authentication).
        3.  Sets up Role-Team associations in Firestore.
        4.  Executes concurrent operations:
            *   Sales create leads.
            *   Managers update those leads.
            *   Admins verify global state.
        5.  Generates a detailed report in the console.
        6.  Deletes all temporary leads and user accounts.
    *   **Requirement**: You must enable **Anonymous Authentication** in the Firebase Console (Build > Authentication > Sign-in method).

## Running Tests

To run all tests:
```bash
npm test
```

To run a specific test:
```bash
npx vitest run src/tests/automation.test.ts
```

## Report Generation
The tests output a tabular report to the console showing:
- User ID and Role
- Action performed
- Success/Failure status
- Execution duration
