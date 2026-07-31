# GymDesk — Phone se Setup (no laptop needed)

## Step 1: Supabase database
Supabase project ke SQL Editor mein supabase-schema.sql file ka content run karo (agar abhi tak nahi kiya).

## Step 2: Ye zip extract karo
Apne phone ke Files/My Files app mein zip pe tap karo -> Extract/Unzip. Ek folder milega jisme ye saari files flat (bina kisi sub-folder ke) honi chahiye.

## Step 3: GitHub pe naya repo banao
- github.com phone browser mein kholo, login karo
- "+" -> New repository -> naam do "gymdesk" -> Create (README add mat karna, empty rakhna)

## Step 4: Files upload karo (bina coding, bina folder banaye)
- Naye repo ke page pe "uploading an existing file" link pe tap karo
- "choose your files" pe tap karo -> apne phone ka file picker khulega
- Extract ki hui folder mein jao, saari files select karo (long-press first file, phir baaki sab tap karo, ya "select all" option use karo)
- Upload hone do, neeche scroll karke "Commit changes" pe tap karo

## Step 5: Vercel pe deploy
- vercel.com phone browser mein kholo, "Continue with GitHub" se login karo
- "Add New" -> "Project" -> apna "gymdesk" repo select karo -> Import
- Deploy se pehle "Environment Variables" section mein 2 add karo:
  - VITE_SUPABASE_URL = tumhara Supabase Project URL
  - VITE_SUPABASE_ANON_KEY = tumhara Supabase anon key
- "Deploy" pe tap karo, 1-2 minute wait karo

## Step 6: Test karo
Jo live link milega (jaise gymdesk-xyz.vercel.app), usko kholo, signup karo, gym setup karo, ek member add karke dekho sab kaam kar raha hai.

## Baaki jo add hona hai
- Razorpay (KYC clear hone ke baad)
- WhatsApp/AI chatbot (secure backend function ke saath)
- Custom domain (jab kharido, Vercel Project Settings -> Domains mein add karna)
