// app/api/signup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Step 1: Kreiraj auth korisnika
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Step 2: Pronađi default kompaniju
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (companiesError) throw companiesError;
    if (!companies || companies.length === 0) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Step 3: Kreiraj employee zapis (OVO ĆE RADITI BEZ RLS GREŠKE)
    const { error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        work_group: 1,
        company_id: companies[0].id
      });

    if (employeeError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw employeeError;
    }

    // Step 4: Kreiraj user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'user'
      });

    // Role error nije kritičan, možemo nastaviti
    if (roleError) {
      console.warn('Role creation warning:', roleError);
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}