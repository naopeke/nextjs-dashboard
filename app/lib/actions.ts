//create a Server Action that is going to be called when the form is submitted.
'use server';

//use Zod, a TypeScript-first validation library that can simplify this task
import { z } from 'zod';
//create an SQL query to insert the new invoice into your database and pass in the variables
import { sql } from '@vercel/postgres';
//Next.js has a Client-side Router Cache that stores the route segments in the user's browser for a time. Along with prefetching, this cache ensures that users can quickly navigate between routes while reducing the number of requests made to the server.
//Since you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server. You can do this with the revalidatePath function from Next.js:
import { revalidatePath } from 'next/cache';
// To redirect
import { redirect } from 'next/navigation';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';


//import Zod and define a schema that matches the shape of your form object. This schema will validate the formData before saving it to a database.
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'],{
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

//Tip: If you're working with forms that have many fields, you may want to consider using the entries() method with JavaScript's Object.fromEntries()
//const rawFormData = Object.fromEntries(formData.entries())

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

  export async function createInvoice(prevState: State, formData: FormData) {
      // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
   // If form validation fails, return errors early. Otherwise, continue.
   if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;


// export async function createInvoice(formData: FormData) {
    // const rawFormData = {

    //pass your rawFormData to CreateInvoice to validate the types:
    // const { customerId, amount, status } = CreateInvoice.parse({
    //   customerId: formData.get('customerId'),
    //   amount: formData.get('amount'),
    //   status: formData.get('status'),
    // });
    // Test it out:
    // console.log(rawFormData);
    // console.log(typeof rawFormData.amount);

    //It's usually good practice to store monetary values in cents in your database to eliminate JavaScript floating-point errors and ensure greater accuracy.
    const amountInCents = amount * 100;
    //create a new date with the format "YYYY-MM-DD" for the invoice's creation date:
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        return {
          message: 'Database Error: Failed to Create Invoice.',
        };
    }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


// export async function updateInvoice(id: string, formData: FormData) {
//     const { customerId, amount, status } = UpdateInvoice.parse({
//       customerId: formData.get('customerId'),
//       amount: formData.get('amount'),
//       status: formData.get('status'),
//     });
   
//     const amountInCents = amount * 100;
   
//     try {
//         await sql`
//             UPDATE invoices
//             SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//             WHERE id = ${id}
//           `;
//     } catch (error) {
//         return { message: 'Database Error: Failed to Update Invoice.' };
//     }
   
//     revalidatePath('/dashboard/invoices');
//     redirect('/dashboard/invoices');
//   }

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
  ) {
    const validatedFields = UpdateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
      };
    }
   
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
   
    try {
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
      return { message: 'Database Error: Failed to Update Invoice.' };
    }
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }


export async function deleteInvoice(id: string) {
    // below is to make error.tsx
    // throw new Error('Failed to Delete Invoice');

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
  }


  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }