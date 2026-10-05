import { ActivitiesCarousel } from '@/components/home/ActivitiesCarousel'
import { getPublishedActivities } from '@/lib/services/activities'

export async function FeaturedActivities() {
  const activities = (await getPublishedActivities({ sort: 'relevance' })).slice(0, 8)
  return <ActivitiesCarousel activities={activities} />
}
