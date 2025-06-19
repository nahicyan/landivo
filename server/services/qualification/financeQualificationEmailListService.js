// server/services/qualification/financeQualificationEmailListService.js
import { prisma } from "../../config/prismaConfig.js";

/**
 * Handles finance qualification email list management
 * Creates or finds list with format: "{Source} {Area} {BuyerType}"
 */
export const handleFinanceQualificationEmailList = async (buyer, property, financeSource = "Finance Qualification") => {
  try {
    // Extract area from property (using area as primary area identifier)
    const area = property.area || "Unknown Area";
    
    // Extract buyer type
    const buyerType = buyer.buyerType || "Unknown Type";
    
    // Construct list name: "{Source} {Area} {BuyerType}"
    const listName = `${financeSource} ${area} ${buyerType}`;
    
    // Check if list already exists with matching source, area, and buyer type
    let emailList = await prisma.emailList.findFirst({
      where: { 
        name: listName,
        source: financeSource
      }
    });
    
    // If list doesn't exist, create it
    if (!emailList) {
      emailList = await createFinanceQualificationEmailList(listName, area, buyerType, financeSource);
      console.log(`Created new finance qualification email list: ${listName}`);
    }
    
    // Check if buyer is already in the list
    const existingMembership = await prisma.buyerEmailList.findFirst({
      where: {
        buyerId: buyer.id,
        emailListId: emailList.id
      }
    });
    
    // Add buyer to list if not already a member
    if (!existingMembership) {
      await prisma.buyerEmailList.create({
        data: {
          buyerId: buyer.id,
          emailListId: emailList.id
        }
      });
      console.log(`Added buyer ${buyer.id} to finance qualification list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: emailList.id,
      buyerAdded: !existingMembership
    };
    
  } catch (error) {
    console.error("Error handling finance qualification email list:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a new email list for finance qualification segmentation
 */
const createFinanceQualificationEmailList = async (listName, area, buyerType, source) => {
  const criteria = {
    areas: [area],
    buyerTypes: [buyerType],
    description: `Buyers who completed finance qualification for ${buyerType} properties in ${area}`
  };
  
  return await prisma.emailList.create({
    data: {
      name: listName,
      description: `Auto-generated list for ${buyerType} buyers completing finance qualification in ${area}`,
      source: source,
      criteria: criteria,
      isDefault: false
    }
  });
};

/**
 * Get all finance qualification email lists
 */
export const getFinanceQualificationEmailLists = async (financeSource = "Finance Qualification") => {
  try {
    const lists = await prisma.emailList.findMany({
      where: {
        source: financeSource
      },
      include: {
        buyerMemberships: {
          include: {
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                buyerType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return lists;
  } catch (error) {
    console.error("Error fetching finance qualification email lists:", error);
    throw error;
  }
};