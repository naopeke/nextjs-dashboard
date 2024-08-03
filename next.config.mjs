/** @type {import('next').NextConfig} */

const nextConfig = {
    //Enable PPR(Partial Prerendering) for your Next.js app by adding the ppr option 
    experimental: {
        ppr: 'incremental',
      },
};

export default nextConfig;
