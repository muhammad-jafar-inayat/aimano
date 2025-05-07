import { Collection } from '@/components/shared/Collection'
import { getAllImages } from '@/lib/actions/image.actions'
import { auth } from "@clerk/nextjs";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from 'react'
import Animation from '@/components/shared/Animation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { getUserImages } from "@/lib/actions/image.actions";
import { getUserById } from "@/lib/actions/user.actions";

const Home = async ({ searchParams }: SearchParamProps) => {
  const page = Number(searchParams?.page) || 1;
  const searchQuery = (searchParams?.query as string) || '';
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
    return null; // Avoids executing the rest of the code before redirection
  }

  const user = await getUserById(userId);

  // Check if user exists before trying to access user._id
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
        <p className="text-gray-600 mb-8">
          Your account is being prepared. This should only take a moment.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-purple-500 text-white rounded-md"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Now that we've confirmed user exists, we can safely access user._id
  const images = await getUserImages({ page, userId: user._id, searchQuery });

  return (
    <>
      <SignedIn>
        <section className="home">
          <h1 className='home-heading'>Ask mano to edit your photo</h1>
          <p className='p-16-regular'>Browse the menu on the side and select what you want!</p>
          <div className='w-full'>
            <Animation />
          </div>
        </section>
      </SignedIn>
     
      <SignedOut>
        <section className="home">
          <h1 className='home-heading'>Ask mano to edit your photo</h1>
          <p className='p-16-regular'>Log in to get started!</p>
          <div className='w-full'>
            <Animation />
          </div>
        </section>
      </SignedOut>

      <section className="mt-12">
        <Collection
          hasSearch={true}
          images={images?.data}
          totalPages={images?.totalPage}
          page={page}
        />
      </section>
    </>
  )
}

export default Home