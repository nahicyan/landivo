import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <section className="py-8 bg-[#FDF8F2] sm:py-12 lg:py-16 xl:py-20">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {/* Heading & Subheading */}
          <div className="text-center">
            <p className="text-sm sm:text-base lg:text-lg font-medium text-[#324c48] font-pj">
              50+ people have secured their dream land
            </p>
            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#3f4f24] font-pj">
              What Our Happy Clients Say
            </h2>
          </div>

          {/* Link to all reviews */}
          <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 text-center md:order-3">
            <a
              href="#"
              title=""
              className="pb-2 text-sm sm:text-base font-bold leading-7 text-[#3f4f24] transition-all duration-200 border-b-2 border-[#3f4f24] hover:border-[#324c48] font-pj focus:outline-none focus:ring-1 focus:ring-[#3f4f24] focus:ring-offset-2 hover:text-[#324c48]"
            >
              Check all 50+ reviews
            </a>
          </div>

          {/* Testimonial Cards Wrapper */}
          <div className="relative mt-8 sm:mt-10 md:mt-16 lg:mt-24 md:order-2 w-full">
            {/* Colorful Glow Background */}
            <div className="absolute -inset-x-1 inset-y-8 sm:inset-y-16 md:-inset-x-2 md:-inset-y-6">
              <div
                className="w-full h-full max-w-5xl mx-auto rounded-3xl opacity-30 blur-lg filter"
                style={{
                  background:
                    "linear-gradient(90deg, #3f4f24 0%, #324c48 50%, #D4A017 100%)",
                }}
              ></div>
            </div>

            {/* Testimonial Cards Grid */}
            <div className="relative grid max-w-lg grid-cols-1 gap-5 mx-auto sm:gap-6 md:max-w-none lg:gap-10 md:grid-cols-3">
              {/* Card 1 */}
              <div className="flex flex-col overflow-hidden shadow-xl rounded-lg">
                <div className="flex flex-col justify-between flex-1 p-5 bg-[#FDF8F2] sm:p-6 lg:py-8 lg:px-7">
                  <div className="flex-1">
                    {/* Star Rating */}
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A017]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="flex-1 mt-4 sm:mt-6 lg:mt-8">
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#3f4f24] font-pj">
                        "I found the perfect lot for my future home, and the team
                        made everything hassle-free. Their listings are always
                        high-quality, and I felt supported at every step!"
                      </p>
                    </blockquote>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center mt-5 sm:mt-6 lg:mt-8">
                    <img
                      className="flex-shrink-0 object-cover rounded-full w-10 h-10 sm:w-11 sm:h-11"
                      src="https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-1.png"
                      alt=""
                    />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-sm sm:text-base font-bold text-[#3f4f24] font-pj">
                        Leslie Alexander
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm font-pj text-[#324c48]">
                        New Landowner
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col overflow-hidden shadow-xl rounded-lg">
                <div className="flex flex-col justify-between flex-1 p-5 bg-[#FDF8F2] sm:p-6 lg:py-8 lg:px-7">
                  <div className="flex-1">
                    {/* Star Rating */}
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A017]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="flex-1 mt-4 sm:mt-6 lg:mt-8">
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#3f4f24] font-pj">
                        "They offered me a range of lots that fit my budget
                        perfectly. From choosing the land to final paperwork, it
                        was all so smooth. I highly recommend them!"
                      </p>
                    </blockquote>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center mt-5 sm:mt-6 lg:mt-8">
                    <img
                      className="flex-shrink-0 object-cover rounded-full w-10 h-10 sm:w-11 sm:h-11"
                      src="https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-2.png"
                      alt=""
                    />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-sm sm:text-base font-bold text-[#3f4f24] font-pj">
                        Jacob Jones
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm font-pj text-[#324c48]">
                        Budget Buyer
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col overflow-hidden shadow-xl rounded-lg">
                <div className="flex flex-col justify-between flex-1 p-5 bg-[#FDF8F2] sm:p-6 lg:py-8 lg:px-7">
                  <div className="flex-1">
                    {/* Star Rating */}
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A017]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="flex-1 mt-4 sm:mt-6 lg:mt-8">
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#3f4f24] font-pj">
                        "I never realized buying land could be this easy. Their
                        customer service is fantastic, and the plot I chose is
                        even better than I'd hoped for!"
                      </p>
                    </blockquote>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center mt-5 sm:mt-6 lg:mt-8">
                    <img
                      className="flex-shrink-0 object-cover rounded-full w-10 h-10 sm:w-11 sm:h-11"
                      src="https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-female.png"
                      alt=""
                    />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-sm sm:text-base font-bold text-[#3f4f24] font-pj">
                        Jenny Wilson
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm font-pj text-[#324c48]">
                        Happy Landowner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* End of Card 3 */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;