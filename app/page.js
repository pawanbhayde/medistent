import Link from "next/link";
import Navbar from "./_components/navbar";
import { Book, Clock, GraduationCap } from "lucide-react";

const Page = () => {
  return (
    <div>
      <Navbar />
      <section className="py-10 center">
        <div className=" flex flex-col items-center text-center">
          <div className="bg-primary border-2 p-4 rounded-3xl mb-8">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Welcome to{" "}
            <span className="text-primary-foreground">Mind Mentor</span>
          </h1>
          <p className="text-zinc-600 text-xl mb-8 max-w-2xl">
            Your AI-powered study assistant for accelerated learning
          </p>
        </div>
      </section>

      <section className="pb-20 ">
        <div className="flex justify-center">
          <div className="max-w-screen-lg grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {/* Feature 1 */}
            <Link href={"/ai-medicine-search"}>
              <div className="bg-white p-8 rounded-xl border-2 border-zinc-900">
                <div className="bg-background w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Book className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Medicine Search</h3>
                <p className="text-muted-foreground">
                  Get Details of any medicine with just a click.
                </p>
              </div>
            </Link>

            {/* Feature 2 */}
            <Link href={"/ai-lab-report-explainer"}>
              <div className="bg-white p-8 rounded-xl border-2 border-zinc-900">
                <div className="bg-background w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  AI Lab Report Explainer
                </h3>
                <p className="text-muted-foreground">
                  Get detailed explanation of your lab reports
                </p>
              </div>
            </Link>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl border-2 border-zinc-900">
              <div className="bg-background w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Doctor</h3>
              <p className="text-muted-foreground">
                Get instant diagnosis and treatment suggestions
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
