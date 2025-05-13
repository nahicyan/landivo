// client/src/pages/AdminHelp/AdminHelp.jsx
import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { BookOpenIcon, HelpCircleIcon, MailIcon, VideoIcon } from "lucide-react";
import { toast } from "react-toastify";

// Tutorial components - modular for easy addition
const TutorialCard = ({ title, description, videoUrl, content }) => {
  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-[#f4f7ee]">
        <CardTitle className="flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-[#D4A017]" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Video section with responsive embedding */}
        {videoUrl && (
          <div className="relative pb-[56.25%] h-0 overflow-hidden">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              width="560"
              height="315"
              src={videoUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
        
        {/* Content section */}
        <div className="p-6">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

// FAQ Item - modular for easy addition
const FaqItem = ({ question, answer }) => {
  return (
    <AccordionItem value={question.replace(/\s+/g, '-').toLowerCase()}>
      <AccordionTrigger className="text-lg font-medium text-[#324c48] hover:text-[#3f4f24]">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-[#324c48]">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
};

export default function AdminHelp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Contact form setup
  const contactForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      requestType: "",
      subject: "",
      message: ""
    }
  });

  const onContactSubmit = (data) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Support request submitted:", data);
      toast.success("Your request has been submitted successfully!");
      contactForm.reset();
      setIsSubmitting(false);
    }, 1500);
  };

  // Tutorial & FAQ data - can be moved to separate files for better organization
  const tutorials = [
    {
      id: "adding-properties",
      title: "Adding Properties with Media",
      description: "Learn how to add new properties with images and videos",
      videoUrl: "https://landivo.com/data/How-To-Add-A-Property.mp4/", // Full video URL
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[#3f4f24]">Step-by-Step Guide</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Properties section from the Admin dashboard</li>
            <li>Click on the "Add New Property" button</li>
            <li>Fill in the property details in the form</li>
            <li>Upload property images and videos using the media uploader</li>
            <li>Set pricing and financing terms</li>
            <li>Save the property</li>
          </ol>
          
          <div className="bg-[#f4f7ee] p-4 rounded-md border border-[#e8efdc] mt-4">
            <p className="text-[#324c48] font-medium">Pro Tip:</p>
            <p className="text-[#324c48]">
              For best results, use high-quality landscape-oriented images with a 16:9 aspect ratio.
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="text-xl font-semibold text-[#3f4f24]">Code Example</h3>
          {/* <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code className="text-sm text-gray-800"> */}
{/* {
`// Example property data structure
const propertyData = {
  title: "Modern Ranch Land",
  description: "Beautiful ranch land with mountain views",
  price: 125000,
  acres: 5.2,
  location: {
    city: "Austin",
    state: "TX"
  },
  // Add other property details
};

// Submit new property
const handleSubmit = async () => {
  try {
    const formData = new FormData();
    
    // Add property data
    formData.append('data', JSON.stringify(propertyData));
    
    // Add images and videos
    files.forEach(file => {
      formData.append('media', file);
    });
    
    const response = await createPropertyWithFiles(formData);
    
    if (response.success) {
      // Handle success
    }
  } catch (error) {
    // Handle error
  }
};`
} */}
            {/* </code>
          </pre> */}
        </div>
      )
    },
    {
      id: "managing-users",
      title: "Managing User Roles and Permissions",
      description: "Learn how to assign and modify user roles and permissions",
      videoUrl: "https://www.youtube.com/embed/jfKfPfyJRdk", // Full video URL (different example)
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[#3f4f24]">Understanding User Roles</h3>
          <p>Our system has the following roles with different access levels:</p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Admin:</span> Full access to all system features and settings
            </li>
            <li>
              <span className="font-medium">Agent:</span> Can manage properties, offers, and buyers
            </li>
            <li>
              <span className="font-medium">User:</span> Standard user with limited access
            </li>
          </ul>
          
          <h3 className="text-xl font-semibold text-[#3f4f24] mt-6">Changing User Roles</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to the Users section in the Admin dashboard</li>
            <li>Find the user you want to modify</li>
            <li>Click on the "Edit" button</li>
            <li>Use the role selector to change their role</li>
            <li>Save the changes</li>
          </ol>
          
          <div className="bg-[#f4f7ee] p-4 rounded-md border border-[#e8efdc] mt-4">
            <p className="text-[#324c48] font-medium">Security Note:</p>
            <p className="text-[#324c48]">
              Always follow the principle of least privilege when assigning roles.
              Users should only have the permissions necessary for their tasks.
            </p>
          </div>
        </div>
      )
    }
  ];
  
  // FAQ data - can be expanded easily by adding more items
  const faqItems = [
    {
      question: "How do I reset a user's password?",
      answer: (
        <div className="space-y-2">
          <p>Admin users can't directly reset passwords as authentication is managed through Auth0. However, you can:</p>
          <ol className="list-decimal pl-6">
            <li>Direct users to use the "Forgot Password" link on the login page</li>
            <li>For urgent cases, you can use the Auth0 dashboard to send a password reset email</li>
          </ol>
        </div>
      )
    },
    {
      question: "How do I set up email notifications?",
      answer: (
        <div className="space-y-2">
          <p>Email notifications are configured in the Settings area:</p>
          <ol className="list-decimal pl-6">
            <li>Go to Admin Settings</li>
            <li>Select "Email Settings" tab</li>
            <li>Configure the SMTP server details</li>
            <li>Set the admin email to receive notifications</li>
            <li>Save your changes</li>
          </ol>
          <p className="mt-2">Make sure to test the connection after setting up.</p>
        </div>
      )
    },
    {
      question: "How do I create a backup of the database?",
      answer: (
        <div className="space-y-2">
          <p>You can create database backups from the Maintenance section:</p>
          <ol className="list-decimal pl-6">
            <li>Go to Admin Settings</li>
            <li>Select the "Maintenance" tab</li>
            <li>Under Database Operations, choose your backup option:</li>
            <ul className="list-disc pl-6 mt-1">
              <li>Local Backup: Saves to the server</li>
              <li>Download Backup: Creates a file you can download</li>
              <li>Online Backup: Stores a copy in the cloud (if configured)</li>
            </ul>
          </ol>
          <p className="mt-2">We recommend creating regular backups, especially before system updates.</p>
        </div>
      )
    },
    {
      question: "How do I add a new financing option for properties?",
      answer: (
        <div className="space-y-2">
          <p>Financing options can be configured globally or per property:</p>
          <p className="font-medium mt-2">For global financing options:</p>
          <ol className="list-decimal pl-6">
            <li>Go to Admin Settings</li>
            <li>Select the "Finance" tab</li>
            <li>Configure default terms, interest rates, and down payment options</li>
          </ol>
          <p className="font-medium mt-2">For property-specific financing:</p>
          <ol className="list-decimal pl-6">
            <li>Edit the specific property</li>
            <li>Navigate to the "Financing" section</li>
            <li>Override the global settings with custom terms</li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#3f4f24]">Help & Support</h1>
          <p className="text-[#324c48]/80 mt-1">
            Find tutorials, answers to common questions, and contact support
          </p>
        </div>
      </div>

      <Tabs defaultValue="tutorials" className="w-full">
        <TabsList className="mb-6 bg-[#f4f7ee]">
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4" />
            Tutorials & FAQ
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MailIcon className="w-4 h-4" />
            Contact
          </TabsTrigger>
        </TabsList>

        {/* Tutorials & FAQ Tab */}
        <TabsContent value="tutorials">
          <Tabs defaultValue="tutorials-tab" className="w-full">
            <TabsList className="mb-6 bg-[#f4f7ee]">
              <TabsTrigger value="tutorials-tab">
                How-To Guides
              </TabsTrigger>
              <TabsTrigger value="faq-tab">
                Common Questions
              </TabsTrigger>
            </TabsList>
            
            {/* Tutorials Section */}
            <TabsContent value="tutorials-tab">
              <div className="grid grid-cols-1 gap-6">
                {tutorials.map(tutorial => (
                  <TutorialCard
                    key={tutorial.id}
                    title={tutorial.title}
                    description={tutorial.description}
                    videoId={tutorial.videoId}
                    content={tutorial.content}
                  />
                ))}
              </div>
            </TabsContent>
            
            {/* FAQ Section */}
            <TabsContent value="faq-tab">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircleIcon className="w-5 h-5 text-[#D4A017]" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Find answers to common questions about the admin system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                      <FaqItem 
                        key={index}
                        question={item.question}
                        answer={item.answer}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailIcon className="w-5 h-5 text-[#D4A017]" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Report bugs, request features, or get help with any issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={contactForm.control}
                      name="name"
                      rules={{ required: "Please enter your name" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="email"
                      rules={{ 
                        required: "Please enter your email",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={contactForm.control}
                    name="requestType"
                    rules={{ required: "Please select a request type" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bug">Report a Bug</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="support">General Support</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of request you're submitting
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="subject"
                    rules={{ required: "Please enter a subject" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of your request" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="message"
                    rules={{ required: "Please enter your message" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide as much detail as possible..." 
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include any relevant details, steps to reproduce issues, or screenshots if possible
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-[#3f4f24] hover:bg-[#3f4f24]/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}